import { Effect } from "effect";

import { AuthenticationGateway } from "../ports/outbound/authentication.gateway";

export const callbackAuthentication = (request: Request) =>
  Effect.gen(function* () {
    const authenticationGateway = yield* AuthenticationGateway;

    return yield* authenticationGateway.callback(request);
  });
