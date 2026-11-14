// Central policy module (brief section 7). Deny by default.
//
// M0 ships only the actions the empty shell needs. M1 replaces the action table with the full
// capability-by-action matrix and generates the permission tests from it; the signature and the
// deny-by-default rule stay as they are.
import type { Capability } from '../config/roleMap.js';

export type Subject =
  | { signedIn: false }
  | { signedIn: true; userId: string; capability: Capability; mode: 'admin' | 'taker' };

export type Decision = {
  allow: boolean;
  reason: string;
  requiresApproval: boolean;
  approverConstraint: null;
};

type Rule = (subject: Subject) => boolean;

// Every action a route can declare. A route registered with an action missing from this table fails
// the manifest test, and `can` denies it.
export const ACTIONS = {
  'system.health': () => true,
  'self.read': (s) => s.signedIn,
} satisfies Record<string, Rule>;

export type Action = keyof typeof ACTIONS;

export function isKnownAction(action: string): action is Action {
  return Object.prototype.hasOwnProperty.call(ACTIONS, action);
}

export function can(subject: Subject, action: string): Decision {
  const deny = (reason: string): Decision => ({ allow: false, reason, requiresApproval: false, approverConstraint: null });
  if (!isKnownAction(action)) return deny('unknown_action');
  return ACTIONS[action](subject)
    ? { allow: true, reason: 'ok', requiresApproval: false, approverConstraint: null }
    : deny(subject.signedIn ? 'forbidden' : 'sign_in_required');
}
