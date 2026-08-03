import { ForbiddenException } from '@nestjs/common';

// ============================================================================
// PROCESSING RESTRICTION — TARGET-SUBJECT CHECK (GDPR Article 18)
// ----------------------------------------------------------------------------
// The global ProcessingRestrictionGuard (registered as APP_GUARD) only checks
// the *acting* user's `processingRestricted` flag, because a guard cannot
// generically know which other user a request targets. When a write endpoint
// processes a *different* user's personal data (e.g. an employer making an
// offer to a worker, a user messaging another conversation participant), the
// target subject's restriction must be checked explicitly in the service.
//
// This helper centralizes that check so it is applied consistently. Callers
// pass a generic `message` that does NOT reveal the restriction, so the fact
// that a user has restricted processing is not leaked to the actor.
// ============================================================================

/**
 * @param client a PrismaClient or a transaction client (`tx`) — both expose
 *               `userGdprFlags.findUnique`, so this works inside `$transaction`.
 * @param targetUserId the user whose data is being processed.
 * @param message the ForbiddenException message; choose wording that does not
 *                disclose that the target has restricted processing.
 */
export async function assertTargetProcessingNotRestricted(
  client: any,
  targetUserId: string,
  message = 'This action is not available for this user.',
): Promise<void> {
  const flags = await client.userGdprFlags.findUnique({
    where: { userId: targetUserId },
    select: { processingRestricted: true },
  });
  if (flags?.processingRestricted) {
    throw new ForbiddenException(message);
  }
}