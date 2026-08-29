export const STAGE_ORDER = [
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

export type Stage = (typeof STAGE_ORDER)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  reading_release_notes: "Reading release notes",
  analyzing_repository: "Analyzing repository",
  breaking_changes_found: "Breaking changes found",
  running_baseline: "Running baseline",
  migrating_code: "Migrating code",
  verifying_upgrade: "Verifying upgrade",
  awaiting_approval: "Awaiting approval",
  opening_pr: "Opening PR",
  complete: "Migration complete",
};

export type StageRecord = {
  stage: Stage;
  status: "active" | "done" | "failed";
  summary?: string;
  ts: string;
};

export type BreakingChange = {
  symbol: string;
  change_type: string;
  before: string;
  after: string;
  source_url: string;
};

export type TestRun = {
  command: string;
  exit_code: number;
  passed: number;
  failed: number;
  errors: number;
  total: number;
  log_excerpt: string;
  installed_version: string;
  legacy_patterns_remaining?: number;
};

export type Approval = {
  id: string;
  status: "pending" | "approved" | "rejected";
  action: { kind: string; repo: string; branch: string; base: string; title: string };
  evidence_summary: string;
  requested_at: string;
  decided_at?: string;
  decided_by?: string;
};

export type Mission = {
  id: string;
  title: string;
  repo: string;
  package: string;
  from_version?: string;
  to_version?: string;
  created_at: string;
  stages: StageRecord[];
  breaking_changes?: {
    source: { url: string; title: string; retrieved_via: string; recovered?: boolean; recovery_note?: string };
    from_version: string;
    to_version: string;
    breaking_changes: BreakingChange[];
  };
  repo_analysis?: {
    package: string;
    current_version: string;
    target_version: string;
    affected_files: { path: string; call_sites: number; symbols: string[] }[];
  };
  baseline?: TestRun;
  verification?: TestRun;
  migration_plan?: {
    files: { path: string; action: "modify" | "create" | "delete"; summary: string }[];
    notes?: string;
  };
  approvals: Approval[];
  pr?: { pr_url: string; branch: string; ts: string };
  activity: { ts: string; kind: string; message: string }[];
};
