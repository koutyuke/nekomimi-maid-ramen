import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InstaxCard } from "./instax-card";

const card = () => screen.getByRole("button", { name: "チェキを裏返す" });

describe("Heroのチェキ", () => {
  it("タップやキーボードの決定で裏返り、もう一度で表に戻る", () => {
    render(<InstaxCard />);
    expect(card().getAttribute("aria-pressed")).toBe("false");
    // キーボードの`Enter`・`Space`は、ボタンのclickとして届く。
    fireEvent.click(card());
    expect(card().getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(card());
    expect(card().getAttribute("aria-pressed")).toBe("false");
  });

  it("なぞって傾けた後に指を離しても裏返らない", () => {
    render(<InstaxCard />);
    fireEvent.pointerDown(card(), { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(card(), { clientX: 60, clientY: 40 });
    fireEvent.pointerUp(card(), { clientX: 60, clientY: 40 });
    fireEvent.click(card());
    expect(card().getAttribute("aria-pressed")).toBe("false");

    // 次の、動かさないタップは裏返す。
    fireEvent.pointerDown(card(), { clientX: 10, clientY: 10 });
    fireEvent.pointerUp(card(), { clientX: 10, clientY: 10 });
    fireEvent.click(card());
    expect(card().getAttribute("aria-pressed")).toBe("true");
  });
});
