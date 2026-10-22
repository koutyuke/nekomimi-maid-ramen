import { getStaffBaseURL } from "@nekomimi/core/http";

const LOCAL_ORIGIN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

export const isTrustedOrigin = (candidate: string | null, staffOrigin: string): candidate is string =>
  candidate !== null &&
  (staffOrigin === getStaffBaseURL(false).origin ? LOCAL_ORIGIN.test(candidate) : candidate === staffOrigin);
