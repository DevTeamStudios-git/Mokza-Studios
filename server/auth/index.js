/* Shared host authentication: one import point for the host API and for Mozora.
 * Changing anything re-exported here changes how BOTH apps authenticate; review accordingly. */
export { RANK_LEVEL, RANK_PERMISSIONS, rankLevel, rankAtLeast, higherRank } from './ranks.js';
export { AUTH_ENABLED, TOKEN_TTL_MS, sign, verify, bearerToken } from './token.js';
export { isDatabaseBacked, accountToUser, dbGetAccount, dbSaveAccount, upsertLoginAccount, authedAccount } from './accounts.js';
export { checkSecret, describeSecret, hashSecret } from './secret.js';
