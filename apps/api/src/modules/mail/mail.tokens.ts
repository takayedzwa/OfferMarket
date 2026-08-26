// DI tokens for email config + transport. Symbols avoid string-token collisions.
export const EMAIL_CONFIG_TOKEN = Symbol('EMAIL_CONFIG');
export const EMAIL_TRANSPORT_TOKEN = Symbol('EMAIL_TRANSPORT');