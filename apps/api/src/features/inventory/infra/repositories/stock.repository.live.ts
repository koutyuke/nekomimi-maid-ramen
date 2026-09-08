import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle";
import { StockRepository } from "../../application/ports/outbound/stock.repository";
import { Stock } from "../../domain/stock";

const decodeStocks = Schema.decodeUnknown(Schema.Array(Stock));

export const StockRepositoryLive = Layer.effect(
  StockRepository,
  Effect.gen(function* () {
    const database = yield* Database;

    const service = {
      listAll: () =>
        database
          .run("在庫の一覧取得", (db) => db.select().from(Database.tables.stocks).all())
          .pipe(
            Effect.flatMap((rows) =>
              decodeStocks(rows).pipe(
                Effect.mapError((cause) => new PersistenceError({ operation: "在庫の復元", cause })),
              ),
            ),
          ),
    };

    return service;
  }),
);
