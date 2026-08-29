import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MissionStore, MissionStoreError } from "./mission.js";
import {
  AwaitApprovalSchema,
  ReportBaselineSchema,
  ReportBreakingChangesSchema,
  ReportEventSchema,
  ReportMigrationPlanSchema,
  ReportPrOpenedSchema,
  ReportRepoAnalysisSchema,
  ReportStageSchema,
  ReportVerificationSchema,
  RequestApprovalSchema,
  StartMissionSchema,
} from "./schemas.js";

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify({ ok: true, data }) }] };
}

function fail(code: string, message: string): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ ok: false, errors: [{ code, message }] }) }],
    isError: true,
  };
}

function guard<A>(handler: (args: A) => ToolResult | Promise<ToolResult>) {
  return async (args: A): Promise<ToolResult> => {
    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof MissionStoreError) return fail(error.code, error.message);
      return fail("internal_error", error instanceof Error ? error.message : String(error));
    }
  };
}

/** Build the Mission Control MCP server: the agent's reporting + approval interface. */
export function buildMcpServer(store: MissionStore): McpServer {
  const server = new McpServer({ name: "mission-control", version: "0.1.0" });

  server.registerTool(
    "start_mission",
    {
      description:
        "Start a new upgrade mission and make it the active mission on the dashboard. " +
        "Call this once at the beginning of an upgrade. Returns the mission_id used by every other tool.",
      inputSchema: StartMissionSchema.shape,
    },
    guard((args) => {
      const mission = store.startMission(StartMissionSchema.parse(args));
      return ok({ mission_id: mission.id, title: mission.title });
    }),
  );

  server.registerTool(
    "report_stage",
    {
      description:
        "Report that a mission stage changed status (active, done, failed). Stages: " +
        "reading_release_notes, analyzing_repository, breaking_changes_found, running_baseline, " +
        "migrating_code, verifying_upgrade, awaiting_approval, opening_pr, complete.",
      inputSchema: ReportStageSchema.shape,
    },
    guard((args) => {
      store.reportStage(ReportStageSchema.parse(args));
      return ok({ recorded: true });
    }),
  );

  server.registerTool(
    "report_breaking_changes",
    {
      description:
        "Report the structured breaking changes extracted from live release/migration documentation, " +
        "with the source of the data. Only report changes actually found in the documentation.",
      inputSchema: ReportBreakingChangesSchema.shape,
    },
    guard((args) => {
      store.reportBreakingChanges(ReportBreakingChangesSchema.parse(args));
      return ok({ recorded: true });
    }),
  );

  server.registerTool(
    "report_repo_analysis",
    {
      description:
        "Report which files and call sites in the target repository are affected by the migration, " +
        "with the current and target dependency versions.",
      inputSchema: ReportRepoAnalysisSchema.shape,
    },
    guard((args) => {
      store.reportRepoAnalysis(ReportRepoAnalysisSchema.parse(args));
      return ok({ recorded: true });
    }),
  );

  server.registerTool(
    "report_baseline",
    {
      description:
        "Report the baseline test run executed in the sandbox with the TARGET dependency version " +
        "installed against the UNMIGRATED code. Numbers must come from the actual command output.",
      inputSchema: ReportBaselineSchema.shape,
    },
    guard((args) => {
      store.reportBaseline(ReportBaselineSchema.parse(args));
      return ok({ recorded: true });
    }),
  );

  server.registerTool(
    "report_migration_plan",
    {
      description: "Report the migration change set: every file modified/created/deleted with a one-line summary.",
      inputSchema: ReportMigrationPlanSchema.shape,
    },
    guard((args) => {
      store.reportMigrationPlan(ReportMigrationPlanSchema.parse(args));
      return ok({ recorded: true });
    }),
  );

  server.registerTool(
    "report_verification",
    {
      description:
        "Report the verification test run executed in the sandbox AFTER applying the migration, " +
        "including the deterministic count of remaining legacy API patterns. " +
        "Numbers must come from the actual command output.",
      inputSchema: ReportVerificationSchema.shape,
    },
    guard((args) => {
      store.reportVerification(ReportVerificationSchema.parse(args));
      return ok({ recorded: true });
    }),
  );

  server.registerTool(
    "report_event",
    {
      description:
        "Report a short activity event for the live feed (subagent started/finished, notable tool call, " +
        "source drift detected, recovery applied, warnings).",
      inputSchema: ReportEventSchema.shape,
    },
    guard((args) => {
      store.reportEvent(ReportEventSchema.parse(args));
      return ok({ recorded: true });
    }),
  );

  server.registerTool(
    "request_approval",
    {
      description:
        "Request human approval for the irreversible external action (opening the GitHub PR). " +
        "Returns an approval_id with status 'pending'. You MUST NOT perform the external action " +
        "until await_approval returns status 'approved'.",
      inputSchema: RequestApprovalSchema.shape,
    },
    guard((args) => {
      const approval = store.requestApproval(RequestApprovalSchema.parse(args));
      return ok({ approval_id: approval.id, status: approval.status });
    }),
  );

  server.registerTool(
    "await_approval",
    {
      description:
        "Long-poll the human decision for an approval. Returns status approved, rejected, or pending " +
        "(call again while pending). Never proceed with the external action unless status is 'approved'.",
      inputSchema: AwaitApprovalSchema.shape,
    },
    guard(async (args) => {
      const input = AwaitApprovalSchema.parse(args);
      const approval = await store.awaitApproval(input.approval_id, input.timeout_seconds);
      return ok({
        approval_id: approval.id,
        status: approval.status,
        decided_at: approval.decided_at,
        decided_by: approval.decided_by,
      });
    }),
  );

  server.registerTool(
    "report_pr_opened",
    {
      description:
        "Record the URL of the opened pull request. Rejected unless a human approved the action first.",
      inputSchema: ReportPrOpenedSchema.shape,
    },
    guard((args) => {
      store.reportPrOpened(ReportPrOpenedSchema.parse(args));
      return ok({ recorded: true });
    }),
  );

  return server;
}
