import { Effect, Layer, Option } from "effect";

import { AuthenticationGateway } from "../application/ports/outbound/authentication.gateway";
import { StaffRepository } from "../application/ports/outbound/staff.repository";
import type { Staff } from "../domain/staff";

export const authenticationGatewayMock = (staff: Staff | null = null) =>
  Layer.succeed(AuthenticationGateway, {
    request: () => Effect.succeed(new Response(null, { status: 501 })),
    callback: () => Effect.succeed(new Response(null, { status: 501 })),
    logout: () => Effect.succeed(new Response(null, { status: 501 })),
    getStaff: () => Effect.succeed(Option.fromNullable(staff)),
  });

export const staffFixture: Staff = { id: "staff-1", email: "staff@gm.ibaraki-ct.ac.jp", name: "担当者", role: "Staff" };

export const staffRepositoryMock = () =>
  Layer.succeed(StaffRepository, {
    list: () => Effect.die("Unexpected staff listing"),
    find: () => Effect.die("Unexpected staff lookup"),
    updateRole: () => Effect.die("Unexpected role change"),
  });
