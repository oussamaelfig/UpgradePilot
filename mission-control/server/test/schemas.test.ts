import { describe, expect, it } from "vitest";
import {
  ReportBreakingChangesSchema,
  ReportVerificationSchema,
  RequestApprovalSchema,
} from "../src/schemas.js";

const validBreakingChanges = {
  mission_id: "m1",
  source: {
    url: "https://github.com/openai/openai-python/discussions/742",
    title: "v1.0.0 Migration Guide",
    retrieved_via: "brightdata.scrape_as_markdown",
  },
  from_version: "0.28.1",
  to_version: "2.48.0",
  breaking_changes: [
    {
      symbol: "openai.ChatCompletion",
      change_type: "removed",
      before: "openai.ChatCompletion.create(...)",
      after: "client.chat.completions.create(...)",
      source_url: "https://github.com/openai/openai-python/discussions/742",
    },
  ],
};

describe("agent payload validation (trust boundary)", () => {
  it("accepts a well-formed breaking-changes report", () => {
    expect(ReportBreakingChangesSchema.safeParse(validBreakingChanges).success).toBe(true);
  });

  it("rejects breaking changes without a documentation source URL", () => {
    const bad = structuredClone(validBreakingChanges) as Record<string, unknown>;
    delete (bad.source as Record<string, unknown>).url;
    expect(ReportBreakingChangesSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an empty breaking-changes list", () => {
    const bad = { ...validBreakingChanges, breaking_changes: [] };
    expect(ReportBreakingChangesSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects invalid change_type values", () => {
    const bad = structuredClone(validBreakingChanges);
    bad.breaking_changes[0]!.change_type = "vibes" as never;
    expect(ReportBreakingChangesSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects verification reports with negative or non-integer counts", () => {
    const base = {
      mission_id: "m1",
      command: "python -m pytest",
      exit_code: 0,
      passed: 12,
      failed: 0,
      errors: 0,
      total: 12,
      log_excerpt: "12 passed in 7.18s",
      installed_version: "2.48.0",
      legacy_patterns_remaining: 0,
    };
    expect(ReportVerificationSchema.safeParse(base).success).toBe(true);
    expect(ReportVerificationSchema.safeParse({ ...base, passed: -1 }).success).toBe(false);
    expect(ReportVerificationSchema.safeParse({ ...base, legacy_patterns_remaining: 1.5 }).success).toBe(false);
  });

  it("rejects approval requests for foreign action kinds or malformed repos", () => {
    const base = {
      mission_id: "m1",
      action: {
        kind: "open_github_pr",
        repo: "oussamaelfig/briefbot",
        branch: "upgrade/openai-v2",
        base: "main",
        title: "Upgrade",
      },
      evidence_summary: "evidence",
    };
    expect(RequestApprovalSchema.safeParse(base).success).toBe(true);
    expect(
      RequestApprovalSchema.safeParse({ ...base, action: { ...base.action, kind: "delete_repo" } }).success,
    ).toBe(false);
    expect(
      RequestApprovalSchema.safeParse({ ...base, action: { ...base.action, repo: "not a repo" } }).success,
    ).toBe(false);
  });
});
