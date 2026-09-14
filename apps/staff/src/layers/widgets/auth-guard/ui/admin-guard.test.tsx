import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { staffQueries } from "../../../entities/staff";
import { openGuard } from "../testing/render-guard";
import { AdminGuard } from "./admin-guard";
import type { Staff } from "../../../entities/staff";

let staff: Staff | null;
let failed: boolean;

beforeEach(() => {
  staff = { id: "staff", name: "担当者", email: "staff@example.com", role: "Staff" };
  failed = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => (failed ? Response.json({}, { status: 500 }) : Response.json({ staff }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SPEC-SYS-006 管理者ガード", () => {
  it.each(["None", "Staff"] as const)("AdminGuardは%sの子を実行しない", async (role) => {
    staff = { ...staff!, role };
    const { content } = openGuard(AdminGuard);

    await screen.findByRole("alert", { name: "権限がありません" });
    expect(content).not.toHaveBeenCalled();
  });

  it.each(["Owner", "Admin"] as const)("AdminGuardは%sを許可し、権限剥奪後は子を隠す", async (role) => {
    staff = { ...staff!, role };
    const { client } = openGuard(AdminGuard);
    await screen.findByText("業務データ");

    staff = { ...staff, role: "None" };
    await act(async () => client.invalidateQueries({ queryKey: staffQueries.current().queryKey }));
    await screen.findByRole("alert", { name: "権限がありません" });
    expect(screen.queryByText("業務データ")).toBeNull();
  });
});
