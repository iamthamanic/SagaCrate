/**
 * display-name unit tests (#682).
 * Location: src/domains/user-profile/display-name.test.ts
 */
import { describe, expect, it } from 'vitest';
import { initialsFromDisplayName, resolveAccountDisplayName } from './display-name';

describe('resolveAccountDisplayName', () => {
  it('prefers profile display name', () => {
    expect(
      resolveAccountDisplayName({
        profileDisplayName: ' Profile ',
        authDisplayName: 'Auth',
        email: 'a@b.c',
      }),
    ).toBe('Profile');
  });

  it('falls back through auth then email local-part', () => {
    expect(
      resolveAccountDisplayName({
        authUsername: 'admin',
        email: 'admin@example.com',
      }),
    ).toBe('admin');
    expect(resolveAccountDisplayName({ email: 'solo@example.com' })).toBe('solo');
    expect(resolveAccountDisplayName({})).toBeNull();
  });
});

describe('initialsFromDisplayName', () => {
  it('builds up to two initials', () => {
    expect(initialsFromDisplayName('admin')).toBe('A');
    expect(initialsFromDisplayName('Ada Lovelace')).toBe('AL');
    expect(initialsFromDisplayName('')).toBe('?');
    expect(initialsFromDisplayName(null)).toBe('?');
  });
});
