import { and, eq, exists, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Effect, Layer, Option } from "effect";

import { Database } from "../../../core/infra/drizzle";
import { StaffRepository } from "../application/ports/outbound/staff.repository";
import { resolveRole } from "../domain/staff";

export const makeStaffRepositoryLive = (ownerEmail: string) =>
  Layer.effect(
    StaffRepository,
    Effect.gen(function* () {
      const database = yield* Database;
      const { users, accounts } = Database.tables;
      const fields = { id: users.id, email: users.email, name: users.name, role: users.role };
      const present = (row: Pick<typeof users.$inferSelect, "id" | "email" | "name" | "role">) => ({
        ...row,
        role: resolveRole(row.role, row.email, ownerEmail),
      });
      return StaffRepository.of({
        findSession: (id) =>
          database.run("通知先セッションの確認", async (db) => {
            const [row] = await db
              .select({
                staff: fields,
                sessionId: Database.tables.sessions.id,
                expiresAt: Database.tables.sessions.expiresAt,
              })
              .from(Database.tables.sessions)
              .innerJoin(users, eq(users.id, Database.tables.sessions.userId))
              .where(eq(Database.tables.sessions.id, id));
            return Option.map(Option.fromNullable(row), (session) => ({ ...session, staff: present(session.staff) }));
          }),
        list: () =>
          database.run("利用者の一覧取得", async (db) => {
            const rows = await db
              .select(fields)
              .from(users)
              .where(
                exists(
                  db
                    .select({ id: accounts.id })
                    .from(accounts)
                    .where(and(eq(accounts.userId, users.id), eq(accounts.providerId, "google"))),
                ),
              )
              .orderBy(users.name, users.id);
            return rows.map(present);
          }),
        find: (id) =>
          database.run("利用者の取得", async (db) => {
            const [row] = await db
              .select(fields)
              .from(users)
              .where(
                and(
                  eq(users.id, id),
                  exists(
                    db
                      .select({ id: accounts.id })
                      .from(accounts)
                      .where(and(eq(accounts.userId, users.id), eq(accounts.providerId, "google"))),
                  ),
                ),
              );
            return Option.map(Option.fromNullable(row), present);
          }),
        updateRole: (actorId, id, role) =>
          database.run("ロールの変更", async (db) => {
            const actor = alias(users, "actor");
            // 確認後の権限剥奪や対象のAdmin昇格も保護するため、変更前後のロールを保存時に再確認する。
            const [row] = await db
              .update(users)
              .set({ role, updatedAt: new Date() })
              .where(
                and(
                  eq(users.id, id),
                  ne(users.id, actorId),
                  ne(users.email, ownerEmail),
                  exists(
                    db
                      .select({ id: actor.id })
                      .from(actor)
                      .where(
                        and(
                          eq(actor.id, actorId),
                          or(
                            eq(actor.email, ownerEmail),
                            and(eq(actor.role, "Admin"), ne(users.role, "Admin"), sql`${role} <> 'Admin'`),
                          ),
                        ),
                      ),
                  ),
                ),
              )
              .returning(fields);
            return Option.map(Option.fromNullable(row), present);
          }),
      });
    }),
  );
