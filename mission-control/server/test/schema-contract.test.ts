import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { BreakingChangeSchema, ReportBreakingChangesSchema } from "../src/schemas.js";

/**
 * The agent-facing JSON schema (skills/release-intel/breaking_changes.schema.json)
 * documents the same contract the server enforces with zod. There is exactly one
 * enforcement point (zod); this test makes drift between the two fail CI.
 */

const here = dirname(fileURLToPath(import.meta.url));
const schemaDoc = JSON.parse(
  readFileSync(join(here, "..", "..", "..", "skills", "release-intel", "breaking_changes.schema.json"), "utf-8"),
);

function requiredKeysOf(shape: Record<string, z.ZodTypeAny>): string[] {
  return Object.entries(shape)
    .filter(([, type]) => !(type instanceof z.ZodOptional) && !(type instanceof z.ZodDefault))
    .map(([key]) => key)
    .sort();
}

describe("agent-facing JSON schema stays in sync with the zod enforcement point", () => {
  it("top-level required fields match", () => {
    expect([...schemaDoc.required].sort()).toEqual(requiredKeysOf(ReportBreakingChangesSchema.shape));
  });

  it("breaking-change item required fields match", () => {
    const itemSchema = schemaDoc.properties.breaking_changes.items;
    expect([...itemSchema.required].sort()).toEqual(requiredKeysOf(BreakingChangeSchema.shape));
  });

  it("change_type enum values match", () => {
    const documented = schemaDoc.properties.breaking_changes.items.properties.change_type.enum;
    const enforced = BreakingChangeSchema.shape.change_type.options;
    expect([...documented].sort()).toEqual([...enforced].sort());
  });

  it("source required fields match", () => {
    const sourceShape = ReportBreakingChangesSchema.shape.source.shape;
    expect([...schemaDoc.properties.source.required].sort()).toEqual(requiredKeysOf(sourceShape));
  });

  it("list bounds match the zod definition exactly", () => {
    const items = schemaDoc.properties.breaking_changes;
    // Introspect the enforced bounds instead of hard-coding them, so a change
    // to either side (zod or JSON schema) breaks this test.
    const arrayDef = (
      ReportBreakingChangesSchema.shape.breaking_changes as unknown as {
        _def: { minLength: { value: number } | null; maxLength: { value: number } | null };
      }
    )._def;
    expect(items.minItems).toBe(arrayDef.minLength?.value);
    expect(items.maxItems).toBe(arrayDef.maxLength?.value);
    expect(typeof items.minItems).toBe("number");
    expect(typeof items.maxItems).toBe("number");
  });
});
