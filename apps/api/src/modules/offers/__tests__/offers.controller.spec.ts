import { Test, TestingModule } from '@nestjs/testing';
import { OffersController } from '../offers.controller';
import { OffersService } from '../offers.service';

/**
 * OffersController unit tests.
 *
 * SECURITY (E-C1): These tests assert that every employer-side endpoint derives
 * the acting employer from the authenticated JWT (`req.user.id`) and never from
 * a query parameter — the previous behaviour was an IDOR that let any employer
 * act on another employer's offers.
 */
describe('OffersController', () => {
  let controller: OffersController;
  let offersService: Partial<OffersService>;

  beforeEach(async () => {
    offersService = {
      createOffer: jest.fn().mockResolvedValue({ id: 'offer-1' }),
      withdrawOffer: jest.fn().mockResolvedValue({ success: true }),
      getOfferForEmployer: jest.fn().mockResolvedValue({ id: 'offer-1' }),
      updateOffer: jest.fn().mockResolvedValue({ id: 'offer-1' }),
      submitOffer: jest.fn().mockResolvedValue({ id: 'offer-1' }),
      listOffersForEmployer: jest.fn().mockResolvedValue([]),
      listOffersForWorker: jest.fn().mockResolvedValue([]),
      getOfferForWorker: jest.fn().mockResolvedValue({ id: 'offer-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [{ provide: OffersService, useValue: offersService }],
    }).compile();

    controller = module.get<OffersController>(OffersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // E-C1: identity is taken from the JWT, not the query string
  // --------------------------------------------------------------------------

  describe('createOffer', () => {
    it('passes the authenticated userId (not a query param) to the service', async () => {
      const dto = { workerId: 'worker-public-1', jobTitle: 'Engineer' };
      const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

      await controller.createOffer(dto as any, req);

      expect(offersService.createOffer).toHaveBeenCalledTimes(1);
      expect(offersService.createOffer).toHaveBeenCalledWith('user-from-jwt', dto);
    });

    it('uses the JWT identity even if a different employerId were present in the request', async () => {
      // The controller no longer reads any employerId param. An attacker-supplied
      // id on the request must be ignored in favour of the JWT subject.
      const dto = { workerId: 'worker-public-1' };
      const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' }, query: { employerId: 'someone-else' } } as any;

      await controller.createOffer(dto as any, req);

      expect(offersService.createOffer).toHaveBeenCalledWith('user-from-jwt', dto);
    });
  });

  describe('withdrawOffer', () => {
    it('passes the authenticated userId to the service', async () => {
      const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

      await controller.withdrawOffer('offer-1', req, 'changed mind');

      expect(offersService.withdrawOffer).toHaveBeenCalledWith('offer-1', 'user-from-jwt', 'changed mind');
    });

    it('forwards an undefined reason when none is supplied', async () => {
      const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

      await controller.withdrawOffer('offer-1', req, undefined);

      expect(offersService.withdrawOffer).toHaveBeenCalledWith('offer-1', 'user-from-jwt', undefined);
    });
  });

  describe('getOfferDetail', () => {
    it('resolves ownership from the JWT', async () => {
      const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

      await controller.getOfferDetail('offer-1', req);

      expect(offersService.getOfferForEmployer).toHaveBeenCalledWith('offer-1', 'user-from-jwt');
    });
  });

  describe('updateOffer', () => {
    it('passes the authenticated userId and the DTO to the service', async () => {
      const dto = { jobTitle: 'Senior Engineer' };
      const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

      await controller.updateOffer('offer-1', req, dto);

      expect(offersService.updateOffer).toHaveBeenCalledWith('offer-1', 'user-from-jwt', dto);
    });
  });

  describe('submitOffer', () => {
    it('resolves ownership from the JWT', async () => {
      const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

      await controller.submitOffer('offer-1', req);

      expect(offersService.submitOffer).toHaveBeenCalledWith('offer-1', 'user-from-jwt');
    });
  });

  describe('listOffers', () => {
    it('routes an EMPLOYER to listOffersForEmployer with their own userId', async () => {
      const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

      await controller.listOffers(req, 'SUBMITTED,VIEWED');

      expect(offersService.listOffersForEmployer).toHaveBeenCalledWith('user-from-jwt', ['SUBMITTED', 'VIEWED']);
      expect(offersService.listOffersForWorker).not.toHaveBeenCalled();
    });

    it('routes a WORKER to listOffersForWorker with their own userId', async () => {
      const req = { user: { id: 'user-from-jwt', role: 'WORKER' } };

      await controller.listOffers(req, undefined);

      expect(offersService.listOffersForWorker).toHaveBeenCalledWith('user-from-jwt', undefined);
      expect(offersService.listOffersForEmployer).not.toHaveBeenCalled();
    });

    it('ignores any workerId/employerId query params (no IDOR)', async () => {
      // The previous implementation branched on workerId/employerId query
      // params, allowing listing any other user's offers. The new controller
      // must disregard them entirely.
      const req = {
        user: { id: 'user-from-jwt', role: 'EMPLOYER' },
        query: { employerId: 'another-employer', workerId: 'another-worker' },
      } as any;

      await controller.listOffers(req, undefined);

      expect(offersService.listOffersForEmployer).toHaveBeenCalledWith('user-from-jwt', undefined);
    });
  });

  describe('listOffersForWorkerMe', () => {
    it('uses the JWT identity and splits the status filter', async () => {
      const req = { user: { id: 'user-from-jwt', role: 'WORKER' } };

      await controller.listOffersForWorkerMe(req, 'ACCEPTED,SHORTLISTED');

      expect(offersService.listOffersForWorker).toHaveBeenCalledWith('user-from-jwt', ['ACCEPTED', 'SHORTLISTED']);
    });
  });
});