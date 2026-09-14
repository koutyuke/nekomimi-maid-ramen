import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

import { staffQueries } from "../../../entities/staff";
import { openGuard } from "../testing/render-guard";
import { AuthGuard } from "./auth-guard";
import type { Staff } from "../../../entities/staff";

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

const openAuthGuard = (props: Omit<ComponentProps<typeof AuthGuard>, "children"> = {}) =>
  openGuard(({ children }) => <AuthGuard {...props}>{children}</AuthGuard>);

describe("SPEC-SYS-006 認証ガード", () => {
  it("認証が確定するまでは子を実行せず、認証後に表示する", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((done) => (resolve = done))),
    );
    const { content } = openGuard(AuthGuard);

    await screen.findByText("ログイン状態を確認しています");
    expect(content).not.toHaveBeenCalled();
    await act(async () => resolve(Response.json({ staff })));
    await screen.findByText("業務データ");
  });

  it.each([undefined, "Admin"] as const)(
    "permission=%sでも未ログインなら子を実行せずログイン画面へ移動する",
    async (permission) => {
      staff = null;
      const { router, content } = openAuthGuard(permission === undefined ? {} : { permission });

      await screen.findByText("ログイン画面");
      expect(router.state.location.pathname).toBe("/");
      expect(content).not.toHaveBeenCalled();
      expect(screen.queryByRole("alert")).toBeNull();
    },
  );

  it.each([undefined, "Admin"] as const)(
    "permission=%sでも未ログイン時はその場でカードを表示し、認証状態の変化に追従する",
    async (permission) => {
      staff = null;
      const { router, content, client } = openAuthGuard({
        ...(permission === undefined ? {} : { permission }),
        unauthenticated: "login-prompt",
      });

      await screen.findByRole("button", { name: "Googleでログイン" });
      expect(router.state.location.pathname).toBe("/protected");
      expect(content).not.toHaveBeenCalled();

      staff = { id: "admin", name: "管理者", email: "admin@example.com", role: "Admin" };
      await act(async () => client.setQueryData(staffQueries.current().queryKey, staff));
      await screen.findByText("業務データ");
      expect(screen.queryByRole("button", { name: "Googleでログイン" })).toBeNull();

      staff = null;
      await act(async () => client.setQueryData(staffQueries.current().queryKey, null));
      await screen.findByRole("button", { name: "Googleでログイン" });
      expect(router.state.location.pathname).toBe("/protected");
      expect(screen.queryByText("業務データ")).toBeNull();
    },
  );

  describe.each([
    [undefined, ["Owner", "Admin", "Staff", "None"]],
    ["None", ["Owner", "Admin", "Staff", "None"]],
    ["Staff", ["Owner", "Admin", "Staff"]],
    ["Admin", ["Owner", "Admin"]],
    ["Owner", ["Owner"]],
  ] as const)("permission=%sの権限境界", (permission, allowedRoles) => {
    it.each(["Owner", "Admin", "Staff", "None"] as const)("%sは必要な権限以上の場合だけ子を実行する", async (role) => {
      staff = { ...staff!, role };
      const { content, router } = openAuthGuard(permission === undefined ? {} : { permission });
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
    const { client } = openAuthGuard({ permission: "Admin" });
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

  it("ログアウトによるキャッシュ更新で子を隠してログイン画面へ移動する", async () => {
    const { client, router } = openGuard(AuthGuard);
    await screen.findByText("業務データ");

    staff = null;
    await act(async () => client.setQueryData(staffQueries.current().queryKey, null));
    await screen.findByText("ログイン画面");
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByText("業務データ")).toBeNull();
  });
});
