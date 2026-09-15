import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { staffQueries } from "../../../entities/staff";
import { openGuard } from "../testing/render-guard";
import { AuthGuard } from "./auth-guard";
import { PermissionGuard } from "./permission-guard";
import type { Staff, StaffRole } from "../../../entities/staff";

let staff: Staff | null;

beforeEach(() => {
  staff = { id: "staff", name: "担当者", email: "staff@example.com", role: "Staff" };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ staff })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const openPermissionGuard = (permission: StaffRole) =>
  openGuard(({ children }) => (
    <AuthGuard>
      <PermissionGuard permission={permission}>{children}</PermissionGuard>
    </AuthGuard>
  ));

describe("SPEC-SYS-006 ページの権限ガード", () => {
  describe.each([
    ["None", ["Owner", "Admin", "Staff", "None"]],
    ["Staff", ["Owner", "Admin", "Staff"]],
    ["Admin", ["Owner", "Admin"]],
    ["Owner", ["Owner"]],
  ] as const)("permission=%sの権限境界", (permission, allowedRoles) => {
    it.each(["Owner", "Admin", "Staff", "None"] as const)("%sは必要な権限以上の場合だけ子を実行する", async (role) => {
      staff = { ...staff!, role };
      const { content, router } = openPermissionGuard(permission);
      if (allowedRoles.some((allowedRole) => allowedRole === role)) {
        await screen.findByText("業務データ");
        expect(screen.queryByRole("alert")).toBeNull();
      } else {
        await screen.findByRole("alert", { name: "権限がありません" });
        expect(screen.queryByText("業務データ")).toBeNull();
        expect(content).not.toHaveBeenCalled();
      }
      expect(router.state.location.pathname).toBe("/protected");
    });
  });

  it.each(["Owner", "Admin"] as const)("管理者権限の%sを許可し、権限剥奪と再付与に追従する", async (role) => {
    staff = { ...staff!, role };
    const { client } = openPermissionGuard("Admin");
    await screen.findByText("業務データ");

    staff = { ...staff, role: "Staff" };
    await act(async () => client.invalidateQueries({ queryKey: staffQueries.current().queryKey }));
    await screen.findByRole("alert", { name: "権限がありません" });
    expect(screen.queryByText("業務データ")).toBeNull();

    staff = { ...staff, role };
    await act(async () => client.invalidateQueries({ queryKey: staffQueries.current().queryKey }));
    await screen.findByText("業務データ");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
