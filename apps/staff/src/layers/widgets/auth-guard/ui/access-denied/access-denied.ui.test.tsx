import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { openGuard } from "../../testing/render-guard";
import { AccessDeniedUI } from "./access-denied.ui";

describe("SPEC-SYS-006 権限拒否からの復帰", () => {
  it("戻るリンクでスタッフページへ移動する", async () => {
    const { router } = openGuard(AccessDeniedUI);

    fireEvent.click(await screen.findByRole("link", { name: "トップページへ戻る" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
