import { Test, TestingModule } from '@nestjs/testing';
import { EmployersController } from '../employers.controller';
import { EmployersService } from '../employers.service';
import { CreateEmployerProfileDto } from '../dto/create-employer-profile.dto';
import { UpdateEmployerProfileDto } from '../dto/update-employer-profile.dto';

/**
 * EmployersController unit tests.
 *
 * Verifies the controller passes the authenticated JWT subject (`req.user.id`)
 * and the typed DTO to the service for both create and update (E-C4/E-C5).
 */
describe('EmployersController', () => {
  let controller: EmployersController;
  let employersService: Partial<EmployersService>;

  beforeEach(async () => {
    employersService = {
      createEmployerProfile: jest.fn().mockResolvedValue({ id: 'employer-1' }),
      getEmployerProfile: jest.fn().mockResolvedValue({ id: 'employer-1' }),
      updateEmployerProfile: jest.fn().mockResolvedValue({ id: 'employer-1' }),
      getVerificationStatus: jest.fn().mockResolvedValue({ status: 'PENDING' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployersController],
      providers: [{ provide: EmployersService, useValue: employersService }],
    }).compile();

    controller = module.get<EmployersController>(EmployersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createProfile passes the JWT userId and the DTO to the service', async () => {
    const dto = new CreateEmployerProfileDto();
    dto.companyName = 'Acme';
    dto.kvkNumber = '12345678';
    const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

    await controller.createProfile(dto, req);

    expect(employersService.createEmployerProfile).toHaveBeenCalledWith('user-from-jwt', dto);
  });

  it('getMyProfile passes the JWT userId', async () => {
    const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

    await controller.getMyProfile(req);

    expect(employersService.getEmployerProfile).toHaveBeenCalledWith('user-from-jwt');
  });

  it('updateProfile passes the JWT userId and the DTO to the service', async () => {
    const dto = new UpdateEmployerProfileDto();
    dto.companyName = 'Acme renamed';
    const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

    await controller.updateProfile(dto, req);

    expect(employersService.updateEmployerProfile).toHaveBeenCalledWith('user-from-jwt', dto);
  });

  it('getVerificationStatus passes the JWT userId', async () => {
    const req = { user: { id: 'user-from-jwt', role: 'EMPLOYER' } };

    await controller.getVerificationStatus(req);

    expect(employersService.getVerificationStatus).toHaveBeenCalledWith('user-from-jwt');
  });
});