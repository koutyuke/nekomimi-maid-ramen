import { isAccessDenied } from "./read-error";
import { getAPIBaseURL } from "@nekomimi/core/http";

export type ResourceScope = "menu" | "orders";

type Actions = {
  /** 更新通知から参照するリソースの範囲。別の範囲の通知は無視する。 */
  scope: ResourceScope;

  /** 手元のデータのリビジョン。未取得の場合は undefined を返す。 */
  getRevision: () => number | undefined;

  /** サーバーの最新リビジョンを照合する。購読終了・タイムアウト時の中止には signal を使う。 */
  checkRevision: (signal: AbortSignal) => Promise<number>;

  /** 取得失敗など、リビジョンの差がなくても再取得が必要な間は true を返す。 */
  needsRefresh: () => boolean;

  /**
   * データを再取得し、完了までに getRevision が参照するデータを更新する。
   * force が true の場合は、要求前に開始した取得だけで済ませず、要求後の変更も回収する。
   * 取得したリビジョンは非負の安全な整数で返し、取得失敗時は拒否する。
   */
  refresh: (force: boolean) => Promise<number>;

  /** WebSocket の接続状態を通知する。HTTP でデータを取得できるかどうかとは独立する。 */
  onConnection: (connected: boolean) => void;

  /** HTTP 照合・データ取得の失敗時は true、成功時や同期の確認時は false を通知する。 */
  onUnavailable: (failed: boolean) => void;

  /** 認可拒否で購読を停止した後に呼ぶ。再接続や定期照合は継続しない。 */
  onDenied: () => void;

  /** 接続成功・対象の通知受信・画面や通信の復帰・HTTP 照合開始時に呼ぶ。取得完了は表さない。 */
  onCheck: () => void;
};

const visible = () => document.visibilityState !== "hidden";

export const subscribeUpdates = (actions: Actions) => {
  let active = true;
  let socket: WebSocket | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;
  let wanted = -1;
  let forcePending = false;
  let refreshing = false;
  let checking = false;
  const abort = new AbortController();

  // 認可拒否として購読を終了する関数
  const deny = () => {
    if (!active) {
      return;
    }
    dispose();
    actions.onConnection(false);
    actions.onDenied();
  };

  // 接続失敗時、エラーの種類による処理を行う関数
  const failed = (error: unknown) => {
    if (!active) {
      return;
    }
    if (isAccessDenied(error)) {
      deny();
    } else {
      actions.onUnavailable(true);
    }
  };

  const refresh = async (force = false) => {
    forcePending ||= force;
    if (!active || !visible() || refreshing) {
      return;
    }

    refreshing = true;
    try {
      while (visible() && (forcePending || actions.needsRefresh() || (actions.getRevision() ?? -1) < wanted)) {
        if (!active) {
          return;
        }
        const forced = forcePending;
        forcePending = false;
        // 到着済みの通知は取得開始時に消さず、返ってきたリビジョンまでだけを消化する。
        // eslint-disable-next-line no-await-in-loop -- 次の取得は直前のリビジョンを確認してから判断する。
        const revision = await actions.refresh(forced);
        if (!active) {
          return;
        }
        if (!Number.isSafeInteger(revision) || revision < 0) {
          throw new Error("Invalid snapshot revision");
        }
        actions.onUnavailable(false);
      }
    } catch (error) {
      failed(error);
    } finally {
      refreshing = false;
    }
  };

  const check = async () => {
    if (!active || !visible() || checking) {
      return;
    }
    checking = true;
    actions.onCheck();
    try {
      const revision = await actions.checkRevision(AbortSignal.any([abort.signal, AbortSignal.timeout(5_000)]));
      if (!active) {
        return;
      }
      if (!Number.isSafeInteger(revision) || revision < 0) {
        throw new Error("Invalid sync revision");
      }
      wanted = Math.max(wanted, revision);
      await refresh();
      if (active && !actions.needsRefresh() && (actions.getRevision() ?? -1) >= wanted) {
        actions.onUnavailable(false);
      }
    } catch (error) {
      failed(error);
    } finally {
      checking = false;
    }
  };

  const connect = () => {
    if (!active || !visible()) {
      return;
    }
    const url = new URL("/staff/events", getAPIBaseURL(import.meta.env.PROD));
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const current = new WebSocket(url);
    socket = current;
    current.addEventListener("open", () => {
      if (!active || socket !== current) {
        return;
      }
      attempts = 0;
      actions.onConnection(true);
      actions.onCheck();
      void refresh(true);
    });
    current.addEventListener("message", (event) => {
      if (!active || socket !== current || typeof event.data !== "string") {
        return;
      }
      let message: unknown;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (
        !message ||
        typeof message !== "object" ||
        !("type" in message) ||
        message.type !== "changed" ||
        !("revisions" in message)
      ) {
        return;
      }
      const revisions = message.revisions;
      if (!revisions || typeof revisions !== "object" || !(actions.scope in revisions)) {
        return;
      }
      const revision: unknown = Reflect.get(revisions, actions.scope);
      if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0) {
        return;
      }
      wanted = Math.max(wanted, revision);
      actions.onCheck();
      void refresh();
    });
    current.addEventListener("close", (event) => {
      if (!active || socket !== current) {
        return;
      }
      actions.onConnection(false);
      if (event.code === 1008) {
        deny();
        return;
      }
      // ハンドシェイクの401/403はブラウザーから読めないため、HTTPでも認可を確かめる。
      void check();
      reconnectTimer = setTimeout(connect, Math.min(30_000, 1_000 * 2 ** attempts++ * (0.8 + Math.random() * 0.4)));
    });
    current.addEventListener("error", () => current.close());
  };

  const resume = () => {
    if (!active || !visible()) {
      return;
    }
    actions.onCheck();
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      clearTimeout(reconnectTimer);
      connect();
    }
    void refresh(true);
  };

  const poll = setInterval(() => {
    void check();
  }, 30_000);

  document.addEventListener("visibilitychange", resume);
  window.addEventListener("online", resume);
  window.addEventListener("pageshow", resume);

  actions.onConnection(false);
  connect();

  function dispose() {
    active = false;
    clearInterval(poll);
    clearTimeout(reconnectTimer);
    abort.abort();
    socket?.close();
    document.removeEventListener("visibilitychange", resume);
    window.removeEventListener("online", resume);
    window.removeEventListener("pageshow", resume);
  }

  return dispose;
};
