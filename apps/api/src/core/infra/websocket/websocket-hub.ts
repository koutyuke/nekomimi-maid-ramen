import { DurableObject } from "cloudflare:workers";

import type { ResourceRevisions } from "../../domain/revision";

export class WebSocketHub extends DurableObject<Env> {
  private readonly authorize: (sessionId: string) => Promise<boolean>;

  constructor(ctx: DurableObjectState, env: Env, authorize: (sessionId: string) => Promise<boolean>) {
    super(ctx, env);
    this.authorize = authorize;
  }

  override async fetch(request: Request): Promise<Response> {
    const sessionId = request.headers.get("x-session-id");

    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response(null, { status: 426 });
    }

    if (!sessionId || !(await this.authorize(sessionId))) {
      return new Response(null, { status: 403 });
    }

    const pair = new WebSocketPair();
    pair[1].serializeAttachment({ sessionId });

    this.ctx.acceptWebSocket(pair[1]);

    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async publish(revisions: ResourceRevisions): Promise<void> {
    await Promise.all(
      this.ctx.getWebSockets().map(async (socket) => {
        try {
          const attachment: unknown = socket.deserializeAttachment();
          if (
            !attachment ||
            typeof attachment !== "object" ||
            !("sessionId" in attachment) ||
            typeof attachment.sessionId !== "string"
          ) {
            socket.close(1008, "Invalid session");
            return;
          }

          const { sessionId } = attachment;
          // 接続時のロールを信用せず、認証機能に現在のセッションと権限を照会する。
          if (!(await this.authorize(sessionId))) {
            socket.close(1008, "Access expired");
            return;
          }

          socket.send(JSON.stringify({ type: "changed", revisions }));
        } catch {
          socket.close(1011, "Update unavailable");
          console.error(JSON.stringify({ operation: "realtime.delivery", message: "変更通知に失敗しました" }));
        }
      }),
    );
  }

  override webSocketMessage(socket: WebSocket): void {
    // 接続は受信専用。業務操作は認証されたHTTP APIだけで受け付ける。
    socket.close(1008, "Receive only");
  }

  override webSocketError(socket: WebSocket): void {
    socket.close(1011, "Connection failed");
  }
}

export const getWebSocketHub = (namespace: DurableObjectNamespace<WebSocketHub>) =>
  namespace.getByName("nekomimi-maid-ramen");

export const connectWebSocketHub = (namespace: DurableObjectNamespace<WebSocketHub>, sessionId: string) =>
  getWebSocketHub(namespace).fetch(
    new Request("https://realtime.internal/", {
      headers: { upgrade: "websocket", "x-session-id": sessionId },
    }),
  );
