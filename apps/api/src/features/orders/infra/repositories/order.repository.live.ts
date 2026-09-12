import { and, eq, isNull } from "drizzle-orm";
import { Effect, Layer, Option, Schema } from "effect";

import { PersistenceError } from "../../../../core/domain/persistence-error";
import { Database } from "../../../../core/infra/drizzle";
import { OrderRepository } from "../../application/ports/outbound/order.repository";
import { OperationalOrder, Order, OrderLine } from "../../domain/order";
import type { ConfirmationRequestId } from "../../domain/order";

const decodeOrder = Schema.decodeUnknown(Order);
const decodeOrderLine = Schema.decodeUnknown(OrderLine);

type OrderRow = typeof Database.tables.orders.$inferSelect;
type OrderLineRow = typeof Database.tables.orderLines.$inferSelect;

const buildOrder = (rows: ReadonlyArray<{ order: OrderRow; line: OrderLineRow | null }>) => {
  const [first] = rows;

  if (first === undefined) {
    return Option.none();
  }

  return Option.some({
    ...first.order,
    lines: rows.flatMap((row) => (row.line === null ? [] : [row.line])),
  });
};

export const OrderRepositoryLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const database = yield* Database;
    const { orders: ordersTable, orderLines: linesTable, menuItems: menuTable } = Database.tables;

    return OrderRepository.of({
      findLine: (id, menuItemId) =>
        database
          .run("注文明細の読み出し", (db) =>
            db
              .select()
              .from(linesTable)
              .where(and(eq(linesTable.orderId, id), eq(linesTable.menuItemId, menuItemId)))
              .get(),
          )
          .pipe(
            Effect.flatMap((row) =>
              row === undefined
                ? Effect.succeedNone
                : decodeOrderLine(row).pipe(
                    Effect.mapError((cause) => new PersistenceError({ operation: "注文明細の復元", cause })),
                    Effect.asSome,
                  ),
            ),
          ),
      findByRequestId: (requestId: ConfirmationRequestId) =>
        database
          .run("注文の読み出し", (db) =>
            db
              .select({ order: ordersTable, line: linesTable })
              .from(ordersTable)
              .leftJoin(linesTable, eq(linesTable.orderId, ordersTable.id))
              .where(eq(ordersTable.requestId, requestId))
              .all(),
          )
          .pipe(
            Effect.map(buildOrder),
            Effect.flatMap(
              Option.match({
                onNone: () => Effect.succeedNone,
                onSome: (candidate) =>
                  decodeOrder(candidate).pipe(
                    Effect.mapError((cause) => new PersistenceError({ operation: "注文の復元", cause })),
                    Effect.asSome,
                  ),
              }),
            ),
          ),
      getRevision: () =>
        database.run("注文のリビジョン取得", async (db) => {
          const row = await db
            .select({ revision: Database.tables.resourceRevisions.revision })
            .from(Database.tables.resourceRevisions)
            .where(eq(Database.tables.resourceRevisions.scope, "orders"))
            .get();

          if (!row) {
            throw new Error("Missing orders revision");
          }

          return row.revision;
        }),
      findMany: (lookup) =>
        database
          .run("注文の一覧取得", (db) =>
            db.batch([
              db
                .select({
                  order: ordersTable,
                  line: {
                    menuItemId: linesTable.menuItemId,
                    quantity: linesTable.quantity,
                    name: menuTable.name,
                    category: menuTable.category,
                    cookingState: linesTable.cookingState,
                  },
                })
                .from(ordersTable)
                .leftJoin(linesTable, eq(linesTable.orderId, ordersTable.id))
                .leftJoin(menuTable, eq(menuTable.id, linesTable.menuItemId))
                .where(
                  lookup
                    ? and(eq(ordersTable.businessDate, lookup.businessDate), isNull(ordersTable.cancelledAt))
                    : isNull(ordersTable.cancelledAt),
                )
                .orderBy(
                  ordersTable.confirmedAt,
                  ordersTable.businessDate,
                  ordersTable.orderNumber,
                  menuTable.displayOrder,
                  menuTable.id,
                ),
              db
                .select({ revision: Database.tables.resourceRevisions.revision })
                .from(Database.tables.resourceRevisions)
                .where(eq(Database.tables.resourceRevisions.scope, "orders")),
            ]),
          )
          .pipe(
            Effect.flatMap(([rows, revisions]) => {
              const grouped = new Map<string, { order: OrderRow; lines: Array<(typeof rows)[number]["line"]> }>();
              for (const row of rows) {
                const line =
                  row.line.menuItemId === null || row.line.name === null
                    ? []
                    : [
                        {
                          ...row.line,
                          menuItemId: row.line.menuItemId,
                          name: row.line.name,
                        },
                      ];
                const current = grouped.get(row.order.id);
                if (current) {
                  current.lines.push(...line);
                } else {
                  grouped.set(row.order.id, { order: row.order, lines: line });
                }
              }
              return Schema.decodeUnknown(Schema.Array(OperationalOrder))(
                [...grouped.values()].map(({ order, lines }) => ({ ...order, lines })),
              ).pipe(Effect.map((data) => ({ data, revision: revisions[0]!.revision })));
            }),
            Effect.mapError((cause) =>
              cause instanceof PersistenceError ? cause : new PersistenceError({ operation: "注文の復元", cause }),
            ),
          ),
    });
  }),
);
