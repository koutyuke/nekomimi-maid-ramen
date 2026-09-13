import { Context } from "effect";
import type { Effect } from "effect";

export class MenuUpdatesGateway extends Context.Tag("MenuUpdatesGateway")<
  MenuUpdatesGateway,
  { readonly notify: () => Effect.Effect<void> }
>() {}
