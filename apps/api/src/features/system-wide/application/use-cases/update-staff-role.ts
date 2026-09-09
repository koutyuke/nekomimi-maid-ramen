import { Effect, Option } from "effect";

import { canChangeRole, canOperate, StaffForbidden, StaffNotFound } from "../../domain/staff";
import { StaffRepository } from "../ports/outbound/staff.repository";
import type { EditableStaffRole, Staff } from "../../domain/staff";

export const updateStaffRole = (actor: Staff, id: string, role: EditableStaffRole) =>
  Effect.gen(function* () {
    if (!canOperate(actor.role, "Admin")) {
      return yield* new StaffForbidden();
    }

    const repository = yield* StaffRepository;
    const target = yield* repository.find(id);

    if (Option.isNone(target)) {
      return yield* new StaffNotFound();
    }

    if (!canChangeRole(actor, target.value, role)) {
      return yield* new StaffForbidden();
    }

    const updated = yield* repository.updateRole(actor.id, id, role);
    if (Option.isNone(updated)) {
      return yield* new StaffForbidden();
    }
    return updated.value;
  });
