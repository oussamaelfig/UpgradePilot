import { z } from "zod";

/**
 * Every payload the agent reports crosses a trust boundary here.
 * Model output is untrusted input: invalid payloads are rejected with
 * structured, actionable errors so the agent can self-correct.
 */

export const STAGES = [
  "reading_release_notes",
  "analyzing_repository",
  "breaking_changes_found",
  "running_baseline",
  "migrating_code",
  "verifying_upgrade",
  "awaiting_approval",
  "opening_pr",
  "complete",
] as const;

export const StageSchema = z.enum(STAGES);
export type Stage = z.infer<typeof StageSchema>;

const missionId = z.string().min(1).max(120);
const shortText = z.string().min(1).max(500);
const longText = z.string().min(1).max(20_000);

export const StartMissionSchema = z.object({
  repo: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, "repo must be in owner/name form")
    .describe("Target repository, owner/name"),
  package: shortText.describe("The dependency being migrated, e.g. openai (Python)"),
  from_version: shortText.optional().describe("Current version if already known"),
  to_version: shortText.optional().describe("Target version if already known"),
  title: shortText.optional().describe("Human-readable mission title"),
});

export const ReportStageSchema = z.object({
  mission_id: missionId,
  stage: StageSchema,
  status: z.enum(["active", "done", "failed"]),
  summary: shortText.optional().describe("One-line, human-readable stage summary"),
});

export const BreakingChangeSchema = z.object({
  symbol: shortText.describe("The API symbol affected, e.g. openai.ChatCompletion"),
  change_type: z.enum(["removed", "renamed", "signature_changed", "config_changed", "behavior_changed"]),
  before: shortText.describe("The pre-migration usage"),
  after: shortText.describe("The post-migration replacement"),
  source_url: z.string().url().describe("Where in the official docs this change is described"),
});

export const ReportBreakingChangesSchema = z.object({
  mission_id: missionId,
  source: z.object({
    url: z.string().url(),
    title: shortText,
    retrieved_via: shortText.describe("Tool used, e.g. brightdata.scrape_as_markdown"),
    recovered: z
      .boolean()
      .optional()
      .describe("True when the primary source failed and a fallback source was used"),
    recovery_note: shortText.optional(),
  }),
  from_version: shortText,
  to_version: shortText,
  breaking_changes: z.array(BreakingChangeSchema).min(1).max(50),
});

export const ReportRepoAnalysisSchema = z.object({
  mission_id: missionId,
  package: shortText,
  current_version: shortText,
  target_version: shortText,
  affected_files: z
    .array(
      z.object({
        path: shortText,
        call_sites: z.number().int().min(0).max(10_000),
        symbols: z.array(shortText).max(50),
      }),
    )
    .max(500),
});

const testRunFields = {
  mission_id: missionId,
  command: shortText.describe("The exact command executed in the sandbox"),
  exit_code: z.number().int().min(0).max(255),
  passed: z.number().int().min(0).max(100_000),
  failed: z.number().int().min(0).max(100_000),
  errors: z.number().int().min(0).max(100_000),
  total: z.number().int().min(0).max(100_000),
  log_excerpt: longText.describe("Raw excerpt from the run output — evidence, not narrative"),
};

export const ReportBaselineSchema = z.object({
  ...testRunFields,
  installed_version: shortText.describe("Dependency version installed for this run"),
});

export const ReportVerificationSchema = z.object({
  ...testRunFields,
  installed_version: shortText,
  legacy_patterns_remaining: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .describe("Deterministic scan count of legacy API patterns still present"),
});

export const ReportMigrationPlanSchema = z.object({
  mission_id: missionId,
  files: z
    .array(
      z.object({
        path: shortText,
        action: z.enum(["modify", "create", "delete"]),
        summary: shortText,
      }),
    )
    .min(1)
    .max(500),
  notes: longText.optional(),
});

export const RequestApprovalSchema = z.object({
  mission_id: missionId,
  action: z.object({
    kind: z.literal("open_github_pr"),
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    branch: shortText,
    base: shortText,
    title: shortText,
  }),
  evidence_summary: longText.describe("What the human is being asked to approve, with evidence"),
});

export const AwaitApprovalSchema = z.object({
  mission_id: missionId,
  approval_id: z.string().min(1),
  timeout_seconds: z.number().int().min(1).max(55).default(25),
});

export const ReportPrOpenedSchema = z.object({
  mission_id: missionId,
  pr_url: z.string().url(),
  branch: shortText,
});

export const ReportEventSchema = z.object({
  mission_id: missionId,
  kind: z.enum(["info", "subagent", "tool", "warning", "recovery"]),
  message: shortText,
});

export const ApprovalDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  decided_by: z.string().min(1).max(120).default("human-operator"),
});
