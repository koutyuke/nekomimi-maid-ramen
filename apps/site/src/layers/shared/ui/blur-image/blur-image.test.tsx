import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BlurImage } from "./blur-image";

describe("BlurImage", () => {
  it("本画像の読み込みが終わるまで代替画像を見せ、読み込み後に本画像へ切り替える", () => {
    const { container } = render(<BlurImage src="/full.webp" placeholder="data:image/webp;base64,AA" alt="ラーメン" />);
    const image = screen.getByRole("img", { name: "ラーメン" });
    const placeholder = container.querySelector('img[src^="data:"]');

    expect(placeholder?.getAttribute("alt")).toBe("");
    expect(image.className).toContain("opacity-0");

    fireEvent.load(image);
    expect(image.className).toContain("opacity-100");
    // 透過のある写真では、残った代替画像が縁から透けて見えるため消す。
    expect(placeholder?.className).toContain("opacity-0");
  });

  it("一度読み込んだ画像は、同じ画像を新しく表示するときに代替画像を見せない", () => {
    const first = render(<BlurImage src="/loaded.webp" placeholder="data:image/webp;base64,AA" alt="餃子" />);
    fireEvent.load(screen.getByRole("img", { name: "餃子" }));
    first.unmount();

    // カードから詳細へ移るときのように、同じ画像を別の要素として表示し直す。
    const { container } = render(<BlurImage src="/loaded.webp" placeholder="data:image/webp;base64,AA" alt="餃子" />);
    expect(screen.getByRole("img", { name: "餃子" }).className).toContain("opacity-100");
    expect(container.querySelector('img[src^="data:"]')?.className).toContain("opacity-0");
  });
});
