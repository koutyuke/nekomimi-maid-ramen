export const LOCAL_ORIGIN_PATTERN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

export const getAPIBaseURL = (production: boolean): URL =>
  new URL(production ? "https://api.nekomimi-ramen.com" : "http://localhost:8787");

export const getWebBaseURL = (production: boolean): URL =>
  new URL(production ? "https://nekomimi-ramen.com" : "http://localhost:5173");

export const getAllowedOrigin = (origin: string): string | RegExp =>
  origin === getWebBaseURL(false).origin ? LOCAL_ORIGIN_PATTERN : origin;

export const isTrustedOrigin = (candidate: string | null, origin: string): candidate is string => {
  const allowed = getAllowedOrigin(origin);
  return candidate !== null && (typeof allowed === "string" ? candidate === allowed : allowed.test(candidate));
};
