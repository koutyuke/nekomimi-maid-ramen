import { Context } from "effect";
import type { Effect, Option } from "effect";

import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { Staff, EditableStaffRole } from "../../../domain/staff";

export class StaffRepository extends Context.Tag("StaffRepository")<
  StaffRepository,
  {
    readonly list: () => Effect.Effect<ReadonlyArray<Staff>, PersistenceError>;
    readonly find: (id: string) => Effect.Effect<Option.Option<Staff>, PersistenceError>;
    readonly updateRole: (
      actorId: string,
      id: string,
      role: EditableStaffRole,
    ) => Effect.Effect<Option.Option<Staff>, PersistenceError>;
  }
>() {}
