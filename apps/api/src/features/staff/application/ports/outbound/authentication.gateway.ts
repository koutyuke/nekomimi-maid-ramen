import { Context } from "effect";
import type { Effect, Option } from "effect";

import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { Staff } from "../../../domain/staff";

export type StaffSession = {
  readonly sessionId: string;
  readonly expiresAt: Date;
  readonly staff: Staff;
};

export class AuthenticationGateway extends Context.Tag("AuthenticationGateway")<
  AuthenticationGateway,
  {
    readonly request: (request: Request) => Effect.Effect<Response, PersistenceError>;
    readonly callback: (request: Request) => Effect.Effect<Response, PersistenceError>;
    readonly logout: (request: Request) => Effect.Effect<Response, PersistenceError>;
    readonly getStaff: (headers: Headers) => Effect.Effect<Option.Option<Staff>, PersistenceError>;
    readonly getSession: (headers: Headers) => Effect.Effect<Option.Option<StaffSession>, PersistenceError>;
  }
>() {}
