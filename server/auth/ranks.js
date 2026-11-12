/* Host rank table: the single source of truth for rank names and their order.
 * Imported by the host API (server/routes/api.js) and by Mozora. Never copy it.
 * Higher number = more authority. A rank string that is not listed here counts as below User. */

export const RANK_LEVEL = { User: -1, Apprentice: 0, Developer: 1, CoOwner: 2, Owner: 3 };

// Permission label the host browser code shows for each rank.
export const RANK_PERMISSIONS = { User: 'USER', Apprentice: 'APPRENTICE', Developer: 'DEVELOPER', CoOwner: 'ALL', Owner: 'ALL' };

// Numeric level of a rank; an unknown or missing rank is -1 (the same as User).
export function rankLevel(rank) {
  return Object.prototype.hasOwnProperty.call(RANK_LEVEL, rank) ? RANK_LEVEL[rank] : -1;
}

// True when `rank` is at least `min` (min must be a listed rank name).
export function rankAtLeast(rank, min) {
  if (!Object.prototype.hasOwnProperty.call(RANK_LEVEL, min)) throw new Error('Unknown rank: ' + min);
  return rankLevel(rank) >= RANK_LEVEL[min];
}

// The higher of two ranks; ties keep the first.
export function higherRank(a, b) {
  return rankLevel(a) >= rankLevel(b) ? a : b;
}
