import { Test } from '@nestjs/testing';
import { MailModule } from '../mail.module';
import { MailService } from '../mail.service';
import { EmailOutboxService } from '../dispatcher/email-outbox.service';
import { EmailDeliveryGate } from '../dispatcher/email-delivery-gate';
import { EmailDispatcher } from '../dispatcher/email-dispatcher.service';
import { EMAIL_TRANSPORT_TOKEN } from '../mail.tokens';
import { LogTransport } from '../transports/log.transport';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PrismaService } from '../../../prisma/prisma.service';

// Verifies the DI wiring: MailModule's useFactory builds the transport from the
// (log) environment and MailService receives it. EMAIL_PROVIDER is unset in the
// test env, so loadEmailConfig returns the log config and createTransport
// returns a LogTransport. The outbox pipeline (EmailOutboxService /
// EmailDeliveryGate / EmailDispatcher) is also wired; PrismaService is imported
// via the @Global PrismaModule and stubbed so no DB connection is opened.
// ScheduleModule is not imported, so the dispatcher's @Interval never arms.
describe('MailModule (DI wiring)', () => {
  it('provides a LogTransport + a working MailService in the test environment', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [MailModule, PrismaModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const service = moduleRef.get(MailService);
    const transport = moduleRef.get(EMAIL_TRANSPORT_TOKEN);

    expect(transport).toBeInstanceOf(LogTransport);
    expect(service).toBeInstanceOf(MailService);

    // End-to-end through the wired transport: send + retrieve from the outbox.
    service.sendVerificationCode('user@example.com', '123456', 'EMAIL', 'en');
    const entry = service.outbox[service.outbox.length - 1];
    expect(entry.to).toBe('user@example.com');
    expect(entry.text).toContain('123456');

    // The outbox pipeline providers are wired.
    expect(moduleRef.get(EmailOutboxService)).toBeInstanceOf(EmailOutboxService);
    expect(moduleRef.get(EmailDeliveryGate)).toBeInstanceOf(EmailDeliveryGate);
    expect(moduleRef.get(EmailDispatcher)).toBeInstanceOf(EmailDispatcher);

    await moduleRef.close();
  });
});