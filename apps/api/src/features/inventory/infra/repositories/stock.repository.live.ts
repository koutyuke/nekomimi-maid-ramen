import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { DatabaseExecutor } from "../../../../core/infra/drizzle/database.executor";
import { stocks } from "../../../../core/infra/drizzle/schema";
import { StockRepository } from "../../application/ports/outbound/stock.repository";
import { Stock } from "../../domain/stock";

const decodeStocks = Schema.decodeUnknown(Schema.Array(Stock));

export const StockRepositoryLive = Layer.effect(
  StockRepository,
  Effect.gen(function* () {
    const database = yield* DatabaseExecutor;

    const service = {
      listAll: () =>
        database
          .execute("在庫の一覧取得", (db) => db.select().from(stocks).all())
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
