import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import {
  ApprovalDecisionSchema,
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
  type Stage,
} from "./schemas.js";

export type MissionEvent = {
  seq: number;
  ts: string;
  type: string;
  data: unknown;
};

export type Approval = {
  id: string;
  mission_id: string;
  action: z.infer<typeof RequestApprovalSchema>["action"];
  evidence_summary: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  decided_at?: string;
  decided_by?: string;
};

export type StageRecord = { stage: Stage; status: "active" | "done" | "failed"; summary?: string; ts: string };

export type Mission = {
  id: string;
  title: string;
  repo: string;
  package: string;
  from_version?: string;
  to_version?: string;
  created_at: string;
  stages: StageRecord[];
  breaking_changes?: z.infer<typeof ReportBreakingChangesSchema>;
  repo_analysis?: z.infer<typeof ReportRepoAnalysisSchema>;
  baseline?: z.infer<typeof ReportBaselineSchema>;
  verification?: z.infer<typeof ReportVerificationSchema>;
  migration_plan?: z.infer<typeof ReportMigrationPlanSchema>;
  approvals: Approval[];
  pr?: { pr_url: string; branch: string; ts: string };
  activity: { ts: string; kind: string; message: string }[];
};

export class MissionStoreError extends Error {
  constructor(
    message: string,
    readonly code:
      | "unknown_mission"
      | "unknown_approval"
      | "already_decided"
      | "approval_required"
      | "approval_mismatch"
      | "no_active_mission",
  ) {
    super(message);
  }
}

export type MissionStatus =
  | { label: "PR OPENED"; kind: "success" }
  | { label: "AWAITING APPROVAL"; kind: "waiting" }
  | { label: "REJECTED"; kind: "danger" }
  | { label: "ATTENTION"; kind: "danger" }
  | { label: "RUNNING"; kind: "active" };

/**
 * Domain status of a mission, in precedence order. Lives here (not in the
 * dashboard) because it is a business decision over PR, approval, and stage
 * state — the UI only renders it.
 */
export function missionStatus(mission: Mission): MissionStatus {
  if (mission.pr) return { label: "PR OPENED", kind: "success" };
  if (mission.approvals.some((a) => a.status === "pending")) return { label: "AWAITING APPROVAL", kind: "waiting" };
  if (mission.approvals.some((a) => a.status === "rejected")) return { label: "REJECTED", kind: "danger" };
  if (mission.stages.some((s) => s.status === "failed")) return { label: "ATTENTION", kind: "danger" };
  return { label: "RUNNING", kind: "active" };
}

type Listener = (event: MissionEvent) => void;

export class MissionStore {
  private missions = new Map<string, Mission>();
  private activeMissionId: string | null = null;
  private events: MissionEvent[] = [];
  private seq = 0;
  private listeners = new Set<Listener>();
  private approvalWaiters = new Map<string, Set<() => void>>();

  constructor(private persistPath?: string) {
    if (persistPath) this.load(persistPath);
  }

  // ---------- events ----------

  private emit(type: string, data: unknown): MissionEvent {
    const event: MissionEvent = { seq: ++this.seq, ts: new Date().toISOString(), type, data };
    this.events.push(event);
    for (const listener of this.listeners) listener(event);
    this.save();
    return event;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  eventsSince(seq: number): MissionEvent[] {
    return this.events.filter((e) => e.seq > seq);
  }

  /** Oldest event sequence still available for replay (persistence caps history). */
  oldestAvailableSeq(): number | null {
    return this.events.length > 0 ? this.events[0]!.seq : null;
  }

  /**
   * Domain decision: is a client's requested replay position unservable —
   * older than the retained window, or ahead of this store's own sequence
   * (store reset/replaced)? Returns the gap payload to announce, or null when
   * replay from `since` is complete and truthful.
   */
  replayGap(since: number): { requested_since: number; oldest_available: number | null; last_seq: number } | null {
    const oldest = this.oldestAvailableSeq();
    const behindWindow = since > 0 && oldest !== null && since < oldest - 1;
    const aheadOfStore = since > this.seq;
    if (!behindWindow && !aheadOfStore) return null;
    return { requested_since: since, oldest_available: oldest, last_seq: this.seq };
  }

  // ---------- mission lifecycle ----------

  startMission(input: z.infer<typeof StartMissionSchema>): Mission {
    const mission: Mission = {
      id: randomUUID().slice(0, 8),
      title: input.title ?? `Upgrade ${input.package} in ${input.repo}`,
      repo: input.repo,
      package: input.package,
      from_version: input.from_version,
      to_version: input.to_version,
      created_at: new Date().toISOString(),
      stages: [],
      approvals: [],
      activity: [],
    };
    this.missions.set(mission.id, mission);
    this.activeMissionId = mission.id;
    this.emit("mission_started", this.snapshot(mission));
    return mission;
  }

  getMission(id: string): Mission {
    const mission = this.missions.get(id);
    if (!mission) throw new MissionStoreError(`unknown mission '${id}'`, "unknown_mission");
    return mission;
  }

  activeMission(): Mission {
    if (!this.activeMissionId) throw new MissionStoreError("no active mission", "no_active_mission");
    return this.getMission(this.activeMissionId);
  }

  hasActiveMission(): boolean {
    return this.activeMissionId !== null;
  }

  // ---------- agent reports ----------

  reportStage(input: z.infer<typeof ReportStageSchema>): void {
    const mission = this.getMission(input.mission_id);
    mission.stages.push({ stage: input.stage, status: input.status, summary: input.summary, ts: new Date().toISOString() });
    this.emit("stage", { mission_id: mission.id, stage: input.stage, status: input.status, summary: input.summary });
  }

  reportBreakingChanges(input: z.infer<typeof ReportBreakingChangesSchema>): void {
    const mission = this.getMission(input.mission_id);
    mission.breaking_changes = input;
    mission.from_version = input.from_version;
    mission.to_version = input.to_version;
    this.emit("breaking_changes", input);
  }

  reportRepoAnalysis(input: z.infer<typeof ReportRepoAnalysisSchema>): void {
    const mission = this.getMission(input.mission_id);
    mission.repo_analysis = input;
    mission.from_version = input.current_version;
    mission.to_version = input.target_version;
    this.emit("repo_analysis", input);
  }

  reportBaseline(input: z.infer<typeof ReportBaselineSchema>): void {
    const mission = this.getMission(input.mission_id);
    mission.baseline = input;
    this.emit("baseline", input);
  }

  reportVerification(input: z.infer<typeof ReportVerificationSchema>): void {
    const mission = this.getMission(input.mission_id);
    mission.verification = input;
    this.emit("verification", input);
  }

  reportMigrationPlan(input: z.infer<typeof ReportMigrationPlanSchema>): void {
    const mission = this.getMission(input.mission_id);
    mission.migration_plan = input;
    this.emit("migration_plan", input);
  }

  reportEvent(input: z.infer<typeof ReportEventSchema>): void {
    const mission = this.getMission(input.mission_id);
    const entry = { ts: new Date().toISOString(), kind: input.kind, message: input.message };
    mission.activity.push(entry);
    this.emit("activity", { mission_id: mission.id, ...entry });
  }

  // ---------- approvals ----------

  requestApproval(input: z.infer<typeof RequestApprovalSchema>): Approval {
    const mission = this.getMission(input.mission_id);
    const approval: Approval = {
      id: randomUUID().slice(0, 8),
      mission_id: mission.id,
      action: input.action,
      evidence_summary: input.evidence_summary,
      status: "pending",
      requested_at: new Date().toISOString(),
    };
    mission.approvals.push(approval);
    mission.stages.push({ stage: "awaiting_approval", status: "active", ts: approval.requested_at });
    this.emit("approval_requested", approval);
    return approval;
  }

  getApproval(approvalId: string): Approval {
    for (const mission of this.missions.values()) {
      const approval = mission.approvals.find((a) => a.id === approvalId);
      if (approval) return approval;
    }
    throw new MissionStoreError(`unknown approval '${approvalId}'`, "unknown_approval");
  }

  decideApproval(approvalId: string, input: z.infer<typeof ApprovalDecisionSchema>): Approval {
    const approval = this.getApproval(approvalId);
    if (approval.status !== "pending") {
      throw new MissionStoreError(
        `approval '${approvalId}' already decided: ${approval.status}`,
        "already_decided",
      );
    }
    approval.status = input.decision;
    approval.decided_at = new Date().toISOString();
    approval.decided_by = input.decided_by;
    this.emit("approval_decided", approval);
    const waiters = this.approvalWaiters.get(approvalId);
    if (waiters) {
      for (const wake of waiters) wake();
      this.approvalWaiters.delete(approvalId);
    }
    return approval;
  }

  /**
   * Long-poll an approval decision. Resolves early when the decision lands.
   * The approval must belong to the given mission — an agent must never be
   * able to satisfy mission A's gate with mission B's approval.
   */
  async awaitApproval(missionId: string, approvalId: string, timeoutSeconds: number): Promise<Approval> {
    const approval = this.getApproval(approvalId);
    if (approval.mission_id !== missionId) {
      throw new MissionStoreError(
        `approval '${approvalId}' belongs to mission '${approval.mission_id}', not '${missionId}'`,
        "approval_mismatch",
      );
    }
    if (approval.status !== "pending") return approval;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.approvalWaiters.get(approvalId)?.delete(wake);
        resolve();
      }, timeoutSeconds * 1000);
      const wake = () => {
        clearTimeout(timer);
        resolve();
      };
      const waiters = this.approvalWaiters.get(approvalId) ?? new Set();
      waiters.add(wake);
      this.approvalWaiters.set(approvalId, waiters);
    });
    return this.getApproval(approvalId);
  }

  /**
   * Recording an opened PR is only legal once a human approved the action —
   * and the recorded PR must be the one that was approved: same branch, and a
   * URL under the approved repository. Approval for one PR must never make a
   * different PR appear approved in the audit state.
   */
  reportPrOpened(input: z.infer<typeof ReportPrOpenedSchema>): void {
    const mission = this.getMission(input.mission_id);
    const approvedApprovals = mission.approvals.filter((a) => a.status === "approved");
    if (approvedApprovals.length === 0) {
      throw new MissionStoreError(
        "refusing to record an opened PR: no approved approval exists for this mission",
        "approval_required",
      );
    }
    const matching = approvedApprovals.find(
      (a) =>
        a.action.branch === input.branch &&
        input.pr_url.startsWith(`https://github.com/${a.action.repo}/pull/`),
    );
    if (!matching) {
      throw new MissionStoreError(
        `refusing to record an opened PR: '${input.pr_url}' (branch '${input.branch}') does not match any approved action`,
        "approval_mismatch",
      );
    }
    mission.pr = { pr_url: input.pr_url, branch: input.branch, ts: new Date().toISOString() };
    this.emit("pr_opened", { mission_id: mission.id, ...mission.pr });
  }

  // ---------- snapshots & persistence ----------

  snapshot(mission?: Mission): Mission {
    return structuredClone(mission ?? this.activeMission());
  }

  lastSeq(): number {
    return this.seq;
  }

  private save(): void {
    if (!this.persistPath) return;
    const state = {
      seq: this.seq,
      activeMissionId: this.activeMissionId,
      missions: [...this.missions.values()],
      events: this.events.slice(-2000),
    };
    mkdirSync(dirname(this.persistPath), { recursive: true });
    // Atomic write: a crash mid-write must never corrupt the live snapshot.
    const tmpPath = `${this.persistPath}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(state));
    renameSync(tmpPath, this.persistPath);
  }

  private load(path: string): void {
    if (!existsSync(path)) return; // first boot
    try {
      // Parse and validate into locals first; commit to instance fields only
      // when the whole snapshot processed cleanly, so a partial failure can
      // never leave half-loaded state behind.
      const state = JSON.parse(readFileSync(path, "utf-8"));
      const seq = typeof state.seq === "number" ? state.seq : 0;
      const events = Array.isArray(state.events) ? state.events : [];
      const missions = new Map<string, Mission>();
      for (const mission of Array.isArray(state.missions) ? state.missions : []) {
        // Structural validation: a mission that would break downstream reads
        // (missionStatus, approval lookups) marks the whole snapshot corrupt.
        if (
          typeof mission?.id !== "string" ||
          !Array.isArray(mission.stages) ||
          !Array.isArray(mission.approvals) ||
          !Array.isArray(mission.activity)
        ) {
          throw new Error(`structurally invalid mission entry: ${JSON.stringify(mission)?.slice(0, 120)}`);
        }
        missions.set(mission.id, mission);
      }
      const activeMissionId =
        typeof state.activeMissionId === "string" && missions.has(state.activeMissionId)
          ? state.activeMissionId
          : null;

      this.seq = seq;
      this.events = events;
      this.missions = missions;
      this.activeMissionId = activeMissionId;
    } catch (error) {
      // Never silently discard state: preserve the unreadable snapshot for
      // inspection and report the failure, then start clean.
      const backupPath = `${path}.corrupt-${Date.now()}`;
      try {
        renameSync(path, backupPath);
      } catch {
        // If even the rename fails there is nothing more we can do safely.
      }
      console.error(
        `mission-control: persisted state at ${path} was unreadable (${
          error instanceof Error ? error.message : String(error)
        }); backed up to ${backupPath} and starting clean`,
      );
    }
  }
}
