import { drizzle } from "drizzle-orm/d1";
import { Context, Effect, Layer } from "effect";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { PersistenceError } from "../../domain/persistence-error";

export class Database extends Context.Tag("Database")<
  Database,
  {
    readonly run: <A>(
      operationName: string,
      operation: (db: DrizzleD1Database) => Promise<A>,
    ) => Effect.Effect<A, PersistenceError>;
  }
>() {}

export const makeDatabaseLive = (d1: D1Database) =>
  Layer.sync(Database, () => {
    const db = drizzle(d1);

    return Database.of({
      run: (operationName, operation) =>
        Effect.tryPromise({
          try: () => operation(db),
          catch: (cause) => new PersistenceError({ operation: operationName, cause }),
        }),
    });
  });
