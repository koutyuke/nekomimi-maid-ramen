import { Context } from "effect";
import type { Effect } from "effect";

import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { ResourceScope } from "../../../../../core/domain/revision";

export class UpdatePublisherGateway extends Context.Tag("UpdatePublisherGateway")<
  UpdatePublisherGateway,
  { readonly publish: (scopes: readonly ResourceScope[]) => Effect.Effect<void, PersistenceError> }
>() {}
