import { describe, expect, it } from "vitest";
import { applyUiLocale, getUiDirection } from "./locale";

describe("UI locale direction", () => {
  it("selects RTL for Arabic language tags", () => {
    expect(getUiDirection("ar-SA")).toBe("rtl");
    expect(getUiDirection("ar")).toBe("rtl");
  });

  it("keeps LTR for English and unknown language tags", () => {
    expect(getUiDirection("en-US")).toBe("ltr");
    expect(getUiDirection(undefined)).toBe("ltr");
  });

  it("applies language and direction attributes", () => {
    const attributes = new Map<string, string>();
    const element = { setAttribute: (name: string, value: string) => attributes.set(name, value) };
    expect(applyUiLocale("ar-EG", element)).toBe("rtl");
    expect(attributes.get("lang")).toBe("ar");
    expect(attributes.get("dir")).toBe("rtl");
  });
});
