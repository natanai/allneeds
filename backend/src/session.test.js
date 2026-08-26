import { describe, expect, it } from 'vitest';

import {
  ALLNEEDS_SESSION_TTL_SECONDS,
  expiredSessionCookie,
  sessionCookie,
} from './session.js';

describe('allneeds session cookies', () => {
  it('persists the browser cookie for the same 30 days as the server session', () => {
    expect(ALLNEEDS_SESSION_TTL_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(sessionCookie('session id')).toBe(
      'allneeds_session=session%20id; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000',
    );
  });

  it('expires the same host-only cookie on sign-out', () => {
    expect(expiredSessionCookie()).toBe(
      'allneeds_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    );
  });
});
