import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
      | "no_active_mission",
  ) {
    super(message);
  }
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

  /** Long-poll an approval decision. Resolves early when the decision lands. */
  async awaitApproval(approvalId: string, timeoutSeconds: number): Promise<Approval> {
    const approval = this.getApproval(approvalId);
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
   * Recording an opened PR is only legal once a human approved the action.
   * This is a deterministic guard against mutation-before-approval ordering bugs.
   */
  reportPrOpened(input: z.infer<typeof ReportPrOpenedSchema>): void {
    const mission = this.getMission(input.mission_id);
    const approved = mission.approvals.some((a) => a.status === "approved");
    if (!approved) {
      throw new MissionStoreError(
        "refusing to record an opened PR: no approved approval exists for this mission",
        "approval_required",
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
    writeFileSync(this.persistPath, JSON.stringify(state));
  }

  private load(path: string): void {
    try {
      const state = JSON.parse(readFileSync(path, "utf-8"));
      this.seq = state.seq ?? 0;
      this.activeMissionId = state.activeMissionId ?? null;
      this.events = state.events ?? [];
      for (const mission of state.missions ?? []) this.missions.set(mission.id, mission);
    } catch {
      // First boot or unreadable snapshot: start clean.
    }
  }
}
