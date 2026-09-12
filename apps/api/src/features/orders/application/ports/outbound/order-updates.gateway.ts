import { Context } from "effect";
import type { Effect } from "effect";

import type { ResourceScope } from "../../../../../core/domain/revision";

export class OrderUpdatesGateway extends Context.Tag("OrderUpdatesGateway")<
  OrderUpdatesGateway,
  {
    readonly notify: (scopes: readonly ResourceScope[]) => Effect.Effect<void>;
  }
>() {}
