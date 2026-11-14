// The ONE place Mozora names host ranks (brief section 4). Every other file asks for a capability.
// A test fails if any other Mozora source file contains a host rank name as a string literal.
//
// Owner decision (2026-11-13): Trainers are CoOwner and Owner only, which is exactly the full-admin
// set. `trainer.hostRoles` is therefore empty; adding a rank there (for example the Developer rank)
// is the only change needed to give that rank limited, cohort-scoped trainer access.
import { RANK_LEVEL, rankLevel } from '../../auth/ranks.js';

export type Capability = 'member' | 'trainer' | 'fullAdmin';

export const roleMap = {
  fullAdmin: { minHostRank: 'CoOwner' },
  trainer: { hostRoles: [] as readonly string[] },
  member: 'default',
} as const;

const rankTable = RANK_LEVEL as Record<string, number>;

// Fails the boot if the map is inconsistent: unknown rank names, or a trainer rank at or above the
// full-admin threshold (that would silently give a "trainer" full-admin powers or vice versa).
export function assertRoleMap(map: typeof roleMap = roleMap): void {
  const threshold = rankTable[map.fullAdmin.minHostRank];
  if (threshold === undefined) {
    throw new Error(`roleMap: unknown full-admin rank "${map.fullAdmin.minHostRank}"`);
  }
  for (const role of map.trainer.hostRoles) {
    const level = rankTable[role];
    if (level === undefined) throw new Error(`roleMap: unknown trainer rank "${role}"`);
    if (level >= threshold) throw new Error(`roleMap: trainer rank "${role}" is not below the full-admin threshold`);
  }
}

// Capability for a host rank as currently stored in user_accounts. An unknown or missing rank is a
// member. A capability says what a user MAY do in the Admin Portal; it never enrols anyone in a
// cohort (only CohortMember rows do) and is ignored entirely in quiz-taking mode.
export function capabilityFor(rank: string | null | undefined, map: typeof roleMap = roleMap): Capability {
  const level = rankLevel(rank ?? '');
  const threshold = rankTable[map.fullAdmin.minHostRank];
  if (threshold !== undefined && level >= threshold) return 'fullAdmin';
  if (rank && map.trainer.hostRoles.includes(rank)) return 'trainer';
  return 'member';
}
