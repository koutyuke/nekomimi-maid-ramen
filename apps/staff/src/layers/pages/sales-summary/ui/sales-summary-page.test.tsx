import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../../../testing/render";
import { TestWebSocket } from "../../../../testing/websocket";
import { AuthGuard, PermissionGuard } from "../../../widgets/auth-guard";
import { salesSummaryFixture } from "../testing";
import { SalesSummaryPage } from "./sales-summary-page";

let summary = salesSummaryFixture;
let revision = 1;
const requests = vi.fn();

beforeEach(() => {
  summary = salesSummaryFixture;
  revision = 1;
  requests.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      requests(url);
      if (url.endsWith("/auth/session")) {
        return Response.json({ staff: { id: "admin", name: "管理者", email: "admin@example.com", role: "Admin" } });
      }
      if (url.endsWith("/staff/orders/revision")) {
        return Response.json({ revision });
      }
      if (url.includes("/staff/sales-summary?")) {
        return Response.json({ ...summary, revision });
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("SPEC-SAL-008 売上集計の表示", () => {
  it("当日の売上を表示し、別端末の注文確定を再読み込みせずに反映する", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T03:00:00Z"));
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthGuard>
          <PermissionGuard permission="Admin">
            <SalesSummaryPage />
          </PermissionGuard>
        </AuthGuard>
      </QueryClientProvider>,
    );

    await screen.findByText("1,650円");
    expect(requests.mock.calls.some(([url]) => String(url).includes("businessDate=2026-10-24"))).toBe(true);

    summary = { ...salesSummaryFixture, orderCount: 3, totalAmount: 2150 };
    revision += 1;
    act(() => TestWebSocket.instances[0]!.change({ orders: revision }));

    await screen.findByText("2,150円");
    expect(screen.getByText("3件")).toBeDefined();
  });
});
