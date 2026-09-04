import { Effect, type ManagedRuntime } from "effect";

export type EffectRunner<R> = <A>(effect: Effect.Effect<A, never, R>) => Promise<A>;

export const makeRunner =
  <R>(runtime: ManagedRuntime.ManagedRuntime<R, never>): EffectRunner<R> =>
  (effect) =>
    runtime.runPromise(effect);

const describeFailure = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const INTERNAL_ERROR_MESSAGE = "Internal Server Error";

/**
 * 失敗を記録し、内部情報を持たないdefectへ変える。
 *
 * Elysiaは処理されなかった例外の`message`を応答本文へそのまま出す。元の失敗を
 * `Effect.orDie`でそのままdefectにすると、操作名と保存先の例外が応答へ現れる。
 */
export const logAndDie = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, never, R> =>
  effect.pipe(
    Effect.tapError((error) => Effect.logError(`利用者が対処できない失敗が発生した: ${describeFailure(error)}`)),
    Effect.catchAll(() => Effect.die(new Error(INTERNAL_ERROR_MESSAGE))),
  );
