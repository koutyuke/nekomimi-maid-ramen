import { Effect } from "effect";

import { AuthenticationGateway } from "../ports/outbound/authentication.gateway";

export const getCurrentStaff = (headers: Headers) =>
  Effect.gen(function* () {
    const authenticationGateway = yield* AuthenticationGateway;

    return yield* authenticationGateway.getStaff(headers);
  });
