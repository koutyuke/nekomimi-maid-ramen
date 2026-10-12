import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTheme } from "./theme";

// 端末の配色設定を試験から切り替えるための`matchMedia`。
const deviceScheme = { dark: false, listeners: new Set<() => void>() };
const changeDeviceScheme = (dark: boolean) => {
  deviceScheme.dark = dark;
  for (const listener of deviceScheme.listeners) {
    listener();
  }
};

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return deviceScheme.dark;
    },
    addEventListener: (_type: string, listener: () => void) => deviceScheme.listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => deviceScheme.listeners.delete(listener),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  deviceScheme.dark = false;
  deviceScheme.listeners.clear();
  document.documentElement.classList.remove("dark");
  delete document.documentElement.dataset["theme"];
});

// Radix Colorsの暗い配色は`dark`クラス、それ以外の配色の判定は`data-theme`属性を見るため、両方がそろうことを確かめる。
const isDark = () => {
  const root = document.documentElement;
  const dark = root.dataset["theme"] === "dark";
  expect(root.classList.contains("dark")).toBe(dark);
  expect(root.dataset["theme"]).toBe(dark ? "dark" : "light");
  return dark;
};

describe("SPEC-VIS-005 公開ページのテーマ", () => {
  it("選択を保存して再表示後に適用し、不正な保存値は端末設定へ戻す", () => {
    const first = renderHook(() => useTheme());
    act(() => first.result.current[1]("dark"));
    expect(isDark()).toBe(true);
    first.unmount();

    expect(renderHook(() => useTheme()).result.current[0]).toBe("dark");
    expect(isDark()).toBe(true);

    localStorage.setItem("site-theme", "invalid");
    expect(renderHook(() => useTheme()).result.current[0]).toBe("system");
  });

  it("端末設定に合わせる間だけ、端末の配色の変更に追従する", () => {
    const { result } = renderHook(() => useTheme());
    expect(isDark()).toBe(false);
    act(() => changeDeviceScheme(true));
    expect(isDark()).toBe(true);

    act(() => result.current[1]("light"));
    act(() => changeDeviceScheme(false));
    act(() => changeDeviceScheme(true));
    expect(isDark()).toBe(false);
  });

  it("保存が拒否されても表示を切り替えられる", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const { result } = renderHook(() => useTheme());
    act(() => result.current[1]("dark"));
    expect(isDark()).toBe(true);
  });
});
