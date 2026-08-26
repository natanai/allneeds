export const ALLNEEDS_SESSION_TTL_DAYS = 30;
export const ALLNEEDS_SESSION_TTL_SECONDS = ALLNEEDS_SESSION_TTL_DAYS * 24 * 60 * 60;

const SESSION_COOKIE_NAME = 'allneeds_session';
const SESSION_COOKIE_ATTRIBUTES = 'HttpOnly; Secure; SameSite=Lax; Path=/';

export function sessionCookie(id) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(id)}; ${SESSION_COOKIE_ATTRIBUTES}; Max-Age=${ALLNEEDS_SESSION_TTL_SECONDS}`;
}

export function expiredSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; ${SESSION_COOKIE_ATTRIBUTES}; Max-Age=0`;
}
