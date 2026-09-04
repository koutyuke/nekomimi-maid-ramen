import { Effect } from "effect";
import type { ManagedRuntime } from "effect";

export type EffectRunner<R> = <A>(effect: Effect.Effect<A, never, R>) => Promise<A>;

export const makeRunner =
  <R>(runtime: ManagedRuntime.ManagedRuntime<R, never>): EffectRunner<R> =>
  (effect) =>
    runtime.runPromise(effect);

const describeFailure = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const INTERNAL_ERROR_MESSAGE = "Internal Server Error";

// DEC-SYS-005
export const logAndDie = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, never, R> =>
  effect.pipe(
    Effect.tapError((error) => Effect.logError(`利用者が対処できない失敗が発生した: ${describeFailure(error)}`)),
    Effect.catchAll(() => Effect.die(new Error(INTERNAL_ERROR_MESSAGE))),
  );
