import { Effect, Logger } from "effect";
import { describe, expect, it } from "vitest";

import { PersistenceError } from "../../../domain/persistence-error";
import { logAndDie } from "../runner";

// 捕捉側で整形すると、本番の記録に原因が残らないことを見逃す。
const captureLogs = () => {
  const messages: string[] = [];
  const layer = Logger.replace(
    Logger.defaultLogger,
    Logger.map(Logger.logfmtLogger, (rendered) => {
      messages.push(rendered);
    }),
  );

  return { messages, layer };
};

describe("SPEC-OPS-002 対処できない失敗の扱い", () => {
  it("原因を記録へ残す", async () => {
    const { messages, layer } = captureLogs();
    const error = new PersistenceError({
      operation: "在庫の一覧取得",
      cause: new Error("D1_CONNECTION_LOST"),
    });

    await Effect.runPromise(logAndDie(Effect.fail(error)).pipe(Effect.provide(layer), Effect.exit));

    expect(messages.join("\n")).toContain("在庫の一覧取得");
    expect(messages.join("\n")).toContain("D1_CONNECTION_LOST");
  });

  it("成功はそのまま通す", async () => {
    const { layer } = captureLogs();

    await expect(Effect.runPromise(logAndDie(Effect.succeed(42)).pipe(Effect.provide(layer)))).resolves.toBe(42);
  });
});
