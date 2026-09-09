import { Option } from "effect";
import { Elysia } from "elysia";
import type { Effect } from "effect";

import { logAndDie } from "../../core/adapters/elysia";
import { canOperate, getCurrentStaff } from "../../features/system-wide/public";
import { isTrustedOrigin } from "@nekomimi/core/http";
import type { EffectRunner } from "../../core/adapters/elysia";

export type StaffAccessRequirements = Effect.Effect.Context<ReturnType<typeof getCurrentStaff>>;

export const staffAccessPlugin = (run: EffectRunner<StaffAccessRequirements>, origin: string) =>
  new Elysia({ name: "staff-access" }).macro({
    staffRole: (required: "Staff" | "Admin") => ({
      resolve: async ({ request, status }) => {
        const staff = await run(logAndDie(getCurrentStaff(request.headers)));

        if (Option.isNone(staff)) {
          return status(401, { code: "authentication_required" } as const);
        }

        if (!canOperate(staff.value.role, required)) {
          return status(403, { code: "forbidden" } as const);
        }

        if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
          const requestOrigin = request.headers.get("origin");
          const trusted = isTrustedOrigin(requestOrigin, origin);

          if (!trusted) {
            return status(403, { code: "forbidden" } as const);
          }
        }
        return { staff: staff.value };
      },
    }),
  });
