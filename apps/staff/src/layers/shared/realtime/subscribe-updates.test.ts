import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TestWebSocket } from "../../../testing/websocket";
import { ReadError } from "../api";
import { subscribeUpdates } from "./subscribe-updates";

let stop: (() => void) | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  TestWebSocket.instances = [];
  vi.stubGlobal("WebSocket", TestWebSocket);
});
afterEach(() => {
  stop?.();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const settle = async () => {
  await vi.advanceTimersByTimeAsync(0);
};

const setup = () => {
  let displayed = 1;
  let remote = 1;
  let status = 200;
  const checkRevision = vi.fn(async () => {
    if (status !== 200) {
      throw new ReadError(status, "照合失敗");
    }
    return remote;
  });
  const actions = {
    scope: "menu" as const,
    checkRevision,
    getRevision: () => displayed,
    needsRefresh: () => false,
    refresh: vi.fn(async (_force: boolean) => {
      displayed = remote;
      return displayed;
    }),
    onConnection: vi.fn(),
    onUnavailable: vi.fn(),
    onDenied: vi.fn(),
    onCheck: vi.fn(),
  };
  stop = subscribeUpdates(actions);
  const socket = TestWebSocket.instances[0]!;
  return {
    socket,
    actions,
    checkRevision,
    setRemote: (revision: number) => {
      remote = revision;
    },
    setStatus: (value: number) => {
      status = value;
    },
    setDisplayed: (revision: number) => {
      displayed = revision;
    },
  };
};

describe("SPEC-SYS-009 通知・照合・取得中の変更の回収", () => {
  it("接続時に取得し、重複通知と別範囲の通知では再取得しない", async () => {
    const { socket, actions } = setup();
    socket.open();
    await settle();
    expect(actions.refresh).toHaveBeenCalledTimes(1);
    socket.change({ menu: 1 });
    socket.change({ orders: 11 });
    await settle();
    expect(actions.refresh).toHaveBeenCalledTimes(1);
    expect(actions.onConnection).toHaveBeenLastCalledWith(true);
  });

  it("通知漏れは接続したまま30秒照合で回収し、変更なしでは一覧を取得しない", async () => {
    const { socket, actions, setRemote, checkRevision } = setup();
    socket.open();
    await settle();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(checkRevision).toHaveBeenCalledTimes(1);
    expect(actions.refresh).toHaveBeenCalledTimes(1);
    setRemote(2);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(actions.refresh).toHaveBeenCalledTimes(2);
    expect(actions.getRevision()).toBe(2);
  });

  it("取得中に新しい通知が届いたら古い取得結果で打ち消さず、完了後に追いつく", async () => {
    const { socket, actions, setRemote, setDisplayed } = setup();
    socket.open();
    await settle();
    let release: ((revision: number) => void) | undefined;
    actions.refresh.mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          release = resolve;
        }),
    );
    setRemote(2);
    socket.change({ menu: 2 });
    await settle();
    setRemote(3);
    socket.change({ menu: 3 });
    socket.change({ menu: 2 });
    setDisplayed(2);
    release!(2);
    await settle();
    expect(actions.refresh).toHaveBeenCalledTimes(3);
    expect(actions.getRevision()).toBe(3);
  });

  it("WebSocketだけの切断ではHTTP失敗扱いにせず、再接続と画面復帰時に取り直す", async () => {
    const { socket, actions } = setup();
    socket.open();
    await settle();
    socket.disconnect();
    await settle();
    expect(actions.onUnavailable).not.toHaveBeenCalledWith(true);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(TestWebSocket.instances.length).toBeGreaterThan(1);
    TestWebSocket.instances.at(-1)!.open();
    await settle();
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(actions.refresh.mock.calls.filter(([force]) => force)).toHaveLength(3);
  });

  it("HTTP照合の失敗と回復を区別し、認可拒否の後は接続も定期照合も止める", async () => {
    const { socket, actions, setStatus, checkRevision } = setup();
    socket.open();
    await settle();
    setStatus(503);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(actions.onUnavailable).toHaveBeenLastCalledWith(true);
    setStatus(200);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(actions.onUnavailable).toHaveBeenLastCalledWith(false);
    setStatus(403);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(actions.onDenied).toHaveBeenCalledTimes(1);
    expect(socket.close).toHaveBeenCalled();
    const calls = checkRevision.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(checkRevision).toHaveBeenCalledTimes(calls);
  });

  it("休止中は照合せず、復帰時に取得し、離脱後は処理を止める", async () => {
    const { socket, actions, checkRevision } = setup();
    socket.open();
    await settle();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await vi.advanceTimersByTimeAsync(30_000);
    expect(checkRevision).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(actions.refresh).toHaveBeenCalledTimes(2);
    stop!();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(checkRevision).not.toHaveBeenCalled();
  });
});
