import { afterEach, describe, expect, it, vi } from "vitest";

import { setupTheme } from "./setup-theme";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("SPEC-VIS-005 公開テーマの保存", () => {
  it("選択を保存して再表示し、不正な保存値は端末設定へ戻す", () => {
    const select = document.createElement("select");
    select.innerHTML =
      '<option value="system">端末設定</option><option value="light">ライト</option><option value="dark">ダーク</option>';
    setupTheme(select);
    select.value = "dark";
    select.dispatchEvent(new Event("change"));
    expect(localStorage.getItem("site-theme")).toBe("dark");
    setupTheme(select);
    expect(select.value).toBe("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    localStorage.setItem("site-theme", "invalid");
    setupTheme(select);
    expect(select.value).toBe("system");
  });
  it("保存が拒否されても表示を切り替えられる", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const select = document.createElement("select");
    select.innerHTML = '<option value="system">端末設定</option><option value="dark">ダーク</option>';
    setupTheme(select);
    select.value = "dark";
    select.dispatchEvent(new Event("change"));
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });
});
