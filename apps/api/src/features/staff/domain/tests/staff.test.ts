import { describe, expect, it } from "vitest";

import { canOperate, resolveRole } from "../staff";

describe("SPEC-SYS-006 設定によるOwnerと操作権限", () => {
  it("Ownerは設定から決まり、保存されたOwnerを信用しない", () => {
    expect(resolveRole("None", "owner@school", "owner@school")).toBe("Owner");
    expect(resolveRole("Owner", "other@school", "owner@school")).toBe("None");
    expect(resolveRole("unknown", "other@school", "owner@school")).toBe("None");
  });
  it.each(["Owner", "Admin", "Staff", "None"] as const)("%sの業務操作を制限する", (role) => {
    expect(canOperate(role, "Staff")).toBe(role !== "None");
    expect(canOperate(role, "Admin")).toBe(role === "Owner" || role === "Admin");
  });
});
