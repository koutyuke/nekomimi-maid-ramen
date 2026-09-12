import { Effect, Option } from "effect";

import { AuthenticationGateway } from "../ports/outbound/authentication.gateway";

export const getCurrentStaff = (headers: Headers) =>
  Effect.gen(function* () {
    const authenticationGateway = yield* AuthenticationGateway;

    const currentSession = yield* authenticationGateway.getSession(headers);

    return Option.map(currentSession, (session) => session.staff);
  });
