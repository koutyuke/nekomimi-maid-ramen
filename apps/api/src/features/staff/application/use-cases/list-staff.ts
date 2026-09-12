import { Effect } from "effect";

import { canOperate, StaffForbidden } from "../../domain/staff";
import { StaffRepository } from "../ports/outbound/staff.repository";
import type { Staff } from "../../domain/staff";

export const listStaff = (actor: Staff) =>
  Effect.gen(function* () {
    if (!canOperate(actor.role, "Admin")) {
      return yield* new StaffForbidden();
    }
    const repository = yield* StaffRepository;
    return yield* repository.findMany();
  });
