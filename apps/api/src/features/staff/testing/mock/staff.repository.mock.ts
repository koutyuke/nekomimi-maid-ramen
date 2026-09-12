import { Effect, Layer } from "effect";

import { StaffRepository } from "../../application/ports/outbound/staff.repository";

export const staffRepositoryMock = () =>
  Layer.succeed(StaffRepository, {
    findMany: () => Effect.die("Unexpected staff listing"),
    find: () => Effect.die("Unexpected staff lookup"),
    findSession: () => Effect.die("Unexpected session lookup"),
    updateRole: () => Effect.die("Unexpected role change"),
  });
