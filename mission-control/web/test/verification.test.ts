import { describe, expect, it } from "vitest";
import { verificationClean } from "../src/components/Panels";
import type { TestRun } from "../src/types";

const cleanRun: TestRun = {
  command: "python -m pytest",
  exit_code: 0,
  passed: 13,
  failed: 0,
  errors: 0,
  total: 13,
  log_excerpt: "13 passed",
  installed_version: "2.48.0",
  legacy_patterns_remaining: 0,
};

describe("verificationClean — the single predicate behind 'verified' wording", () => {
  it("is false when no verification run exists", () => {
    expect(verificationClean(undefined)).toBe(false);
  });

  it("is false on a nonzero exit code even with zero failures", () => {
    expect(verificationClean({ ...cleanRun, exit_code: 2 })).toBe(false);
  });

  it("is false when tests failed despite exit 0", () => {
    expect(verificationClean({ ...cleanRun, failed: 2 })).toBe(false);
  });

  it("is false when collection errors occurred despite exit 0", () => {
    expect(verificationClean({ ...cleanRun, errors: 1 })).toBe(false);
  });

  it("is false while legacy call sites remain", () => {
    expect(verificationClean({ ...cleanRun, legacy_patterns_remaining: 3 })).toBe(false);
  });

  it("is false for a clean run whose legacy scan count is absent — missing evidence is not zero", () => {
    expect(verificationClean({ ...cleanRun, legacy_patterns_remaining: undefined })).toBe(false);
  });

  it("is true for the fully clean case", () => {
    expect(verificationClean(cleanRun)).toBe(true);
  });
});
