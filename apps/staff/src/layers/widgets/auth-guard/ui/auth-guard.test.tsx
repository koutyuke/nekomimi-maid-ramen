import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { staffQueries } from "../../../entities/staff";
import { openGuard } from "../testing/render-guard";
import { AdminGuard } from "./admin-guard";
import { AuthGuard } from "./auth-guard";
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

const LoginPromptAuthGuard = ({ children }: { children: ReactNode }) => (
  <AuthGuard unauthenticated="login-prompt">{children}</AuthGuard>
);

const LoginPromptAdminGuard = ({ children }: { children: ReactNode }) => (
  <AdminGuard unauthenticated="login-prompt">{children}</AdminGuard>
);

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

  it.each([AuthGuard, AdminGuard])("%sは未ログインなら子を実行せずログイン画面へ移動する", async (Guard) => {
    staff = null;
    const { router, content } = openGuard(Guard);

    await screen.findByText("ログイン画面");
    expect(router.state.location.pathname).toBe("/");
    expect(content).not.toHaveBeenCalled();
  });

  it.each([LoginPromptAuthGuard, LoginPromptAdminGuard])(
    "%sは未ログイン時にその場でカードを表示し、認証状態の変化に追従する",
    async (Guard) => {
      staff = null;
      const { router, content, client } = openGuard(Guard);

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
