import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../../../../testing/render-ui";
import { AuthLoadingUI } from "./auth-loading.ui";

describe("SPEC-SYS-006 認証確認中の案内", () => {
  it("認証確認中であることを読み上げ対象の状態として伝える", () => {
    render(<AuthLoadingUI />);

    expect(screen.getByRole("status").textContent).toBe("ログイン状態を確認しています");
  });
});
