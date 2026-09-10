import { getSiteBaseURL, getStaffBaseURL } from "@nekomimi/core/http";

const LOCAL_ORIGIN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;
const PUBLIC_ORIGINS = [
  getSiteBaseURL(true).origin,
  /^https:\/\/(?:[a-z0-9-]+-)?nekomimi-ramen-(?:web|staff)\.koutyuke\.workers\.dev$/,
];

const matchesOrigin = (candidate: string | null, allowed: readonly (string | RegExp)[]): candidate is string =>
  candidate !== null &&
  allowed.some((origin) => (typeof origin === "string" ? candidate === origin : origin.test(candidate)));

export const isTrustedOrigin = (candidate: string | null, staffOrigin: string): candidate is string =>
  matchesOrigin(candidate, [staffOrigin === getStaffBaseURL(false).origin ? LOCAL_ORIGIN : staffOrigin]);

export const isPublicOrigin = (candidate: string | null): candidate is string =>
  matchesOrigin(candidate, PUBLIC_ORIGINS);
