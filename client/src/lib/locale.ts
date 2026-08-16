export type UiDirection = "rtl" | "ltr";

export function getUiDirection(language: string | undefined): UiDirection {
  return /^ar(?:-|$)/i.test(language?.trim() || "") ? "rtl" : "ltr";
}

export function applyUiLocale(language: string | undefined, documentElement: Pick<HTMLElement, "setAttribute">) {
  const direction = getUiDirection(language);
  documentElement.setAttribute("lang", direction === "rtl" ? "ar" : "en");
  documentElement.setAttribute("dir", direction);
  return direction;
}
