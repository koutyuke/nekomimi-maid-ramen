import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render-ui";
import { AuthErrorUI } from "./auth-error.ui";

describe("SPEC-SYS-006 認証確認の再試行表示", () => {
  it("再読み込みの操作をコンテナーへ通知する", () => {
    const onRetry = vi.fn();
    render(<AuthErrorUI onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
