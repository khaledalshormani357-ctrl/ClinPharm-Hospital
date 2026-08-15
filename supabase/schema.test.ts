import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Supabase schema safety", () => {
  it("enables RLS and owner isolation for private clinical tables", () => {
    const schema = readFileSync(resolve(process.cwd(), "supabase/schema.sql"), "utf8");
    expect(schema).toContain("alter table public.clinical_patients enable row level security");
    expect(schema).toContain("auth.uid() = owner_id");
    expect(schema).toContain("create policy \"patients are owner isolated\"");
    expect(schema).not.toMatch(/service[_-]?role/i);
  });
});
