import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorSection } from "./sponsor-section";

describe("SPEC-VIS-003 承認されたスポンサー情報を表示する", () => {
  it("承認済みのスポンサー情報がない間は、ご協賛にComing soonだけを表示する", () => {
    render(<SponsorSection />);
    const section = screen.getByRole("region", { name: "ご協賛" });
    expect(section.textContent?.replaceAll(/[\\/\s]/g, "")).toBe("ご協賛Comingsoon");
  });
});
