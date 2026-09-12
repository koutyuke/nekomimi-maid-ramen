import { Effect, Layer, Option } from "effect";

import { AuthenticationGateway } from "../../application/ports/outbound/authentication.gateway";
import type { Staff } from "../../domain/staff";

export const authenticationGatewayMock = (staff: Staff | null = null) =>
  Layer.succeed(AuthenticationGateway, {
    request: () => Effect.succeed(new Response(null, { status: 501 })),
    callback: () => Effect.succeed(new Response(null, { status: 501 })),
    logout: () => Effect.succeed(new Response(null, { status: 501 })),
    getSession: () =>
      Effect.succeed(
        staff
          ? Option.some({ staff, sessionId: "test-session", expiresAt: new Date(Date.now() + 60_000) })
          : Option.none(),
      ),
  });
