import { afterEach, describe, expect, it } from "vitest";
import { uiCopy } from "./ui-copy";

describe("Arabic UI copy", () => {
  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  it("returns Arabic copy in RTL mode", () => {
    (globalThis as { document?: unknown }).document = { documentElement: { dir: "rtl" } };
    expect(uiCopy("Patients")).toBe("المرضى");
  });

  it("keeps English fallback in LTR mode", () => {
    (globalThis as { document?: unknown }).document = { documentElement: { dir: "ltr" } };
    expect(uiCopy("Patients")).toBe("Patients");
    expect(uiCopy("Untranslated label")).toBe("Untranslated label");
  });
});
