import { Effect, Option } from "effect";

import { canOperate } from "../../domain/staff";
import { AuthenticationGateway } from "../ports/outbound/authentication.gateway";
import { StaffRepository } from "../ports/outbound/staff.repository";

export const getConnectionSession = (headers: Headers) =>
  Effect.gen(function* () {
    const gateway = yield* AuthenticationGateway;
    return yield* gateway.getSession(headers);
  });

export const canReceiveUpdates = (sessionId: string) =>
  Effect.gen(function* () {
    const repository = yield* StaffRepository;
    const session = yield* repository.findSession(sessionId);
    return (
      Option.isSome(session) &&
      session.value.expiresAt.getTime() > Date.now() &&
      canOperate(session.value.staff.role, "Staff")
    );
  });
