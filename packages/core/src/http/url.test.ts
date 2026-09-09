import { describe, expect, it } from "vitest";

import { getAPIBaseURL, getWebBaseURL, isTrustedOrigin } from "./url";

describe("環境別URLと送信元の制限", () => {
  it("本番ではローカル環境を許可せず、指定した送信元だけを許可する", () => {
    const origin = getWebBaseURL(true).origin;
    expect(getAPIBaseURL(true).origin).toBe("https://api.nekomimi-ramen.com");
    expect(origin).toBe("https://nekomimi-ramen.com");
    expect(isTrustedOrigin(origin, origin)).toBe(true);
    for (const candidate of [null, "http://localhost:5173", "http://127.0.0.1:5173", `${origin}.attacker.example`]) {
      expect(isTrustedOrigin(candidate, origin)).toBe(false);
    }
  });
  it("開発時はローカルの可変ポートを許可し、偽装したホスト名を拒否する", () => {
    const origin = getWebBaseURL(false).origin;
    expect(getAPIBaseURL(false).origin).toBe("http://localhost:8787");
    expect(origin).toBe("http://localhost:5173");
    for (const candidate of [origin, "http://localhost:5174", "http://127.0.0.1:5173"]) {
      expect(isTrustedOrigin(candidate, origin)).toBe(true);
    }
    for (const candidate of [
      null,
      "http://localhost.attacker.example",
      "http://localhost:5173@attacker.example",
      "https://localhost:5173",
      "http://192.168.1.2:5173",
    ]) {
      expect(isTrustedOrigin(candidate, origin)).toBe(false);
    }
  });
});
