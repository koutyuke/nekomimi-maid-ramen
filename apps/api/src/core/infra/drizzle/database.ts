import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import { Context, Effect, Layer } from "effect";

import { PersistenceError } from "../../domain/persistence-error";

export type DatabaseService = {
  // DEC-SYS-005
  readonly run: <A>(
    operation: string,
    query: (db: DrizzleD1Database) => Promise<A>,
  ) => Effect.Effect<A, PersistenceError>;
};

export class Database extends Context.Tag("Database")<Database, DatabaseService>() {}

export const makeDatabaseService = (d1: D1Database): DatabaseService => {
  const db = drizzle(d1);

  return {
    run: (operation, query) =>
      Effect.tryPromise({
        try: () => query(db),
        catch: (cause) => new PersistenceError({ operation, cause }),
      }),
  };
};

export const databaseLayer = (d1: D1Database) => Layer.sync(Database, () => makeDatabaseService(d1));
