// ============================================================================
// EMAIL ERRORS — two-state failure taxonomy
// ----------------------------------------------------------------------------
// The dispatcher (Phase 2) only needs to answer one question: "should I try
// this again?" So failures are either `retryable` (transient: rate limit, 5xx,
// timeout, network) or `permanent` (invalid recipient, bad auth, bad request).
// Structured metadata (providerCode, httpStatus, safeMessage) is preserved for
// logging without committing to a rigid six-way taxonomy up front.
//
// `safeMessage` must NOT contain raw provider responses that may include
// recipient data or provider secrets — sanitize before constructing.
// ============================================================================

export type EmailFailureKind = 'retryable' | 'permanent';

export class EmailError extends Error {
  constructor(
    public readonly kind: EmailFailureKind,
    public readonly providerCode?: string,
    public readonly httpStatus?: number,
    public readonly safeMessage?: string,
  ) {
    super(safeMessage ?? kind);
    this.name = 'EmailError';
  }
}