import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { staffQueries } from "../../../../entities/staff";
import { openGuard } from "../../testing/render-guard";
import { AuthGuard } from "../auth-guard";
import type { Staff } from "../../../../entities/staff";

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

const SwitchableAuthGuard = ({ children }: { children: ReactNode }) => {
  const [showLogin, setShowLogin] = useState(false);
  return (
    <>
      <button onClick={() => setShowLogin(true)}>ログイン案内へ切り替える</button>
      <AuthGuard unauthenticated={showLogin ? "login-prompt" : "redirect"}>{children}</AuthGuard>
    </>
  );
};

describe("SPEC-SYS-006 認証エラーの判別と回復", () => {
  it.each([AuthGuard, LoginPromptAuthGuard])("%sは認証取得の失敗では移動せず、再試行で回復する", async (Guard) => {
    failed = true;
    const { router, content } = openGuard(Guard);

    await screen.findByText("ログイン状態を確認できません");
    expect(router.state.location.pathname).toBe("/protected");
    expect(content).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Googleでログイン" })).toBeNull();
    failed = false;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByText("業務データ");
  });

  it("認証の再取得に失敗したら古い認証情報で子を表示せず、再試行で回復する", async () => {
    const { client } = openGuard(AuthGuard);
    await screen.findByText("業務データ");

    failed = true;
    await act(async () => client.invalidateQueries({ queryKey: staffQueries.current().queryKey }));
    await screen.findByText("ログイン状態を確認できません");
    expect(screen.queryByText("業務データ")).toBeNull();

    failed = false;
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    await screen.findByText("業務データ");
  });

  it("子の業務エラーを認証エラーとして表示しない", async () => {
    openGuard(
      AuthGuard,
      vi.fn(() => {
        throw new Error("業務処理の失敗");
      }),
    );

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("業務画面のエラー"));
    expect(screen.queryByText("ログイン状態を確認できません")).toBeNull();
  });

  it("別の購読元で認証情報が更新されても、捕捉済みのエラーを再試行できる", async () => {
    failed = true;
    const { client } = openGuard(SwitchableAuthGuard);
    await screen.findByRole("button", { name: "再読み込み" });

    failed = false;
    await act(async () => client.fetchQuery(staffQueries.current()));
    fireEvent.click(screen.getByRole("button", { name: "ログイン案内へ切り替える" }));
    fireEvent.click(await screen.findByRole("button", { name: "再読み込み" }));
    await screen.findByText("業務データ");
    expect(screen.queryByText("業務画面のエラー")).toBeNull();
  });
});
