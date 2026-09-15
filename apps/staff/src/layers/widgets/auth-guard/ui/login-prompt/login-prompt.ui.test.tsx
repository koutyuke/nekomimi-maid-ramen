import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render-ui";
import { LoginPromptUI } from "./login-prompt.ui";

describe("SPEC-SYS-006 ログイン案内の表示と操作", () => {
  it("処理中は操作を受け付けず、失敗後は案内を表示して再操作できる", () => {
    const onLogin = vi.fn();
    const { rerender } = render(<LoginPromptUI busy loginFailed={false} onLogin={onLogin} />);

    fireEvent.click(screen.getByRole("button", { name: "Googleでログイン" }));
    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();

    rerender(<LoginPromptUI busy={false} loginFailed onLogin={onLogin} />);
    expect(screen.getByRole("alert").textContent).toContain("学校のGoogleアカウント");
    fireEvent.click(screen.getByRole("button", { name: "Googleでログイン" }));
    expect(onLogin).toHaveBeenCalledOnce();
  });
});
