import { Effect, Layer, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle/database";
import { stocks } from "../../../../core/infra/drizzle/schema";
import { StockRepository, type StockRepositoryService } from "../../application/ports/stock.repository";
import { Stock } from "../../domain/stock";

const decodeStocks = Schema.decodeUnknown(Schema.Array(Stock));

export const stockRepositoryLayer = Layer.effect(
  StockRepository,
  Effect.gen(function* () {
    const database = yield* Database;

    const service: StockRepositoryService = {
      listAll: () =>
        database
          .run("在庫の一覧取得", (db) => db.select().from(stocks).all())
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
