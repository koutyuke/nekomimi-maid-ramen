import { describe, expect, it } from "vitest";

import { PersistenceError } from "../persistence-error";

describe("SPEC-OPS-002 保存先の失敗の記録内容", () => {
  it("操作と原因の説明を記録できる形にする", () => {
    const error = new PersistenceError({
      operation: "在庫の一覧取得",
      cause: new Error("D1_CONNECTION_LOST"),
    });

    expect(error.message).toContain("在庫の一覧取得");
    expect(error.message).toContain("D1_CONNECTION_LOST");
  });

  it("Error以外の原因も説明に残す", () => {
    const error = new PersistenceError({ operation: "在庫の復元", cause: "想定外の行" });

    expect(error.message).toContain("在庫の復元");
    expect(error.message).toContain("想定外の行");
  });
});
