import { vi } from "vitest";

export class TestWebSocket extends EventTarget {
  static instances: TestWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  readyState = TestWebSocket.CONNECTING;
  readonly url: string;
  close = vi.fn(() => {
    this.readyState = TestWebSocket.CLOSED;
  });

  constructor(url: string | URL) {
    super();
    this.url = String(url);
    TestWebSocket.instances.push(this);
  }

  open() {
    this.readyState = TestWebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  change(revisions: { menu?: number; orders?: number }) {
    this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify({ type: "changed", revisions }) }));
  }

  disconnect(code = 1006) {
    this.readyState = TestWebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent("close", { code }));
  }
}
