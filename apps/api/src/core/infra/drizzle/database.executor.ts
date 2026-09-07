import { drizzle } from "drizzle-orm/d1";
import { Context, Effect, Layer } from "effect";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { PersistenceError } from "../../domain/persistence-error";

export class DatabaseExecutor extends Context.Tag("DatabaseExecutor")<
  DatabaseExecutor,
  {
    readonly execute: <A>(
      operation: string,
      query: (db: DrizzleD1Database) => Promise<A>,
    ) => Effect.Effect<A, PersistenceError>;
  }
>() {}

export const makeDatabaseExecutorLive = (d1: D1Database) =>
  Layer.sync(DatabaseExecutor, () => {
    const db = drizzle(d1);

    return DatabaseExecutor.of({
      execute: (operation, query) =>
        Effect.tryPromise({
          try: () => query(db),
          catch: (cause) => new PersistenceError({ operation, cause }),
        }),
    });
  });
