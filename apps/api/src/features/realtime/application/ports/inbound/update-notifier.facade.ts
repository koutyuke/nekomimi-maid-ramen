import { Context } from "effect";
import type { Effect } from "effect";

import type { ResourceScope } from "../../../../../core/domain/revision";

export class UpdateNotifierFacade extends Context.Tag("UpdateNotifierFacade")<
  UpdateNotifierFacade,
  { readonly notify: (scopes: readonly ResourceScope[]) => Effect.Effect<void> }
>() {}
