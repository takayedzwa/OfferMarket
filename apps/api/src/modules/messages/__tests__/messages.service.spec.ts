import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagesService } from '../messages.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('MessagesService — sendMessage', () => {
  let prisma: any;
  let eventEmitter: { emit: jest.Mock };
  let service: MessagesService;

  beforeEach(() => {
    eventEmitter = { emit: jest.fn() };
    prisma = {
      conversation: { findUnique: jest.fn(), update: jest.fn() },
      message: { create: jest.fn() },
      user: { findUnique: jest.fn() },
      userGdprFlags: { findUnique: jest.fn() },
    };
    service = new MessagesService(prisma as PrismaService, eventEmitter as any);
  });

  it('blocks sending when the recipient has restricted processing (E-H8 target-subject)', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      participant1Id: 'worker-user',
      participant2Id: 'employer-user',
    });
    // Recipient (employer-user) has restricted processing.
    prisma.userGdprFlags.findUnique.mockResolvedValue({ processingRestricted: true });

    // Sender is the worker.
    await expect(
      service.sendMessage('conv-1', 'worker-user', 'hello'),
    ).rejects.toThrow(ForbiddenException);

    // Must not create a message or notify the recipient.
    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('sends when the recipient has not restricted processing', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      participant1Id: 'worker-user',
      participant2Id: 'employer-user',
    });
    prisma.userGdprFlags.findUnique.mockResolvedValue({ processingRestricted: false });
    prisma.message.create.mockResolvedValue({ id: 'msg-1', content: 'hello' });
    prisma.user.findUnique.mockResolvedValue({ id: 'employer-user', role: 'EMPLOYER' });
    prisma.conversation.update.mockResolvedValue({});

    const result = await service.sendMessage('conv-1', 'worker-user', 'hello');
    expect(result).toEqual({ id: 'msg-1', content: 'hello' });
    expect(prisma.message.create).toHaveBeenCalled();
  });
});