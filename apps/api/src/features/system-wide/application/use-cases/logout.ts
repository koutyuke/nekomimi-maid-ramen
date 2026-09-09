import { Effect } from "effect";

import { AuthenticationGateway } from "../ports/outbound/authentication.gateway";

export const logout = (request: Request) =>
  Effect.gen(function* () {
    const authenticationGateway = yield* AuthenticationGateway;

    return yield* authenticationGateway.logout(request);
  });
