// Rank names appear in this test file on purpose: it is the test of the one module allowed to name them.
import { describe, expect, it } from 'vitest';
import { assertRoleMap, capabilityFor, roleMap } from '../config/roleMap.js';

describe('roleMap', () => {
  it('maps the owner decision: full-admins are CoOwner and above, no limited trainers', () => {
    expect(capabilityFor('Owner')).toBe('fullAdmin');
    expect(capabilityFor('CoOwner')).toBe('fullAdmin');
    expect(capabilityFor('Developer')).toBe('member');
    expect(capabilityFor('Apprentice')).toBe('member');
    expect(capabilityFor('User')).toBe('member');
  });

  it('treats unknown, empty and missing ranks as member', () => {
    for (const r of ['owner', 'Admin', '', null, undefined]) expect(capabilityFor(r)).toBe('member');
  });

  it('gives a rank trainer access by adding it to one array', () => {
    const withDevs = { ...roleMap, trainer: { hostRoles: ['Developer'] } } as unknown as typeof roleMap;
    expect(capabilityFor('Developer', withDevs)).toBe('trainer');
    expect(capabilityFor('Apprentice', withDevs)).toBe('member');
    expect(() => assertRoleMap(withDevs)).not.toThrow();
  });

  it('refuses to boot with a trainer rank at or above the full-admin threshold', () => {
    const bad = { ...roleMap, trainer: { hostRoles: ['CoOwner'] } } as unknown as typeof roleMap;
    expect(() => assertRoleMap(bad)).toThrow(/not below/);
  });

  it('refuses to boot with unknown rank names', () => {
    expect(() => assertRoleMap({ ...roleMap, trainer: { hostRoles: ['Trainer'] } } as unknown as typeof roleMap)).toThrow(/unknown trainer/);
    expect(() => assertRoleMap({ ...roleMap, fullAdmin: { minHostRank: 'Boss' } } as unknown as typeof roleMap)).toThrow(/unknown full-admin/);
  });

  it('the shipped map is valid', () => {
    expect(() => assertRoleMap()).not.toThrow();
  });
});
