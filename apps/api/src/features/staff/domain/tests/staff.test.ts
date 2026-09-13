import { describe, expect, it } from "vitest";

import { canOperate, resolveRole } from "../staff";

describe("SPEC-SYS-006 保存済みロールと操作権限", () => {
  it("保存されたOwnerを使用し、未知のロールには権限を与えない", () => {
    expect(resolveRole("None")).toBe("None");
    expect(resolveRole("Owner")).toBe("Owner");
    expect(resolveRole("unknown")).toBe("None");
  });
  it.each(["Owner", "Admin", "Staff", "None"] as const)("%sの業務操作を制限する", (role) => {
    expect(canOperate(role, "Staff")).toBe(role !== "None");
    expect(canOperate(role, "Admin")).toBe(role === "Owner" || role === "Admin");
  });
});
