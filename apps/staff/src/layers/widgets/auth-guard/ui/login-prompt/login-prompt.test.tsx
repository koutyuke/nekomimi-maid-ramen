import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../../testing/render-ui";
import { LoginPrompt } from "./login-prompt";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SPEC-SYS-006 ログインの開始と再試行", () => {
  it("カードからログインを開始し、処理中の連打を防ぎ、失敗後に再試行できる", async () => {
    let resolve!: (response: Response) => void;
    const assign = vi.spyOn(window.location, "assign").mockImplementation(() => {});
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      expect(url).toContain("/auth/google");
      expect(init?.method).toBe("POST");
      return new Promise<Response>((done) => (resolve = done));
    });
    vi.stubGlobal("fetch", fetch);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LoginPrompt />
      </QueryClientProvider>,
    );

    const button = await screen.findByRole("button", { name: "Googleでログイン" });
    fireEvent.click(button);
    await waitFor(() => expect(button.hasAttribute("disabled")).toBe(true));
    fireEvent.click(button);
    expect(
      fetch.mock.calls.filter(([input]) =>
        (input instanceof Request ? input.url : String(input)).endsWith("/auth/google"),
      ),
    ).toHaveLength(1);

    await act(async () => resolve(Response.json({}, { status: 500 })));
    await screen.findByText("ログインできませんでした");
    expect(assign).not.toHaveBeenCalled();
    expect(screen.queryByText("ログイン状態を確認できません")).toBeNull();

    fireEvent.click(button);
    await waitFor(() =>
      expect(
        fetch.mock.calls.filter(([input]) =>
          (input instanceof Request ? input.url : String(input)).endsWith("/auth/google"),
        ),
      ).toHaveLength(2),
    );
    await act(async () => resolve(Response.json({ url: "https://accounts.google.com/test-login" })));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://accounts.google.com/test-login"));
  });
});
