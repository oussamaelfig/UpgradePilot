import { describe, expect, it } from "vitest";
import { MissionStore, MissionStoreError } from "../src/mission.js";

function startedStore() {
  const store = new MissionStore();
  const mission = store.startMission({ repo: "oussamaelfig/briefbot", package: "openai (Python)" });
  return { store, mission };
}

const approvalInput = (missionId: string) => ({
  mission_id: missionId,
  action: {
    kind: "open_github_pr" as const,
    repo: "oussamaelfig/briefbot",
    branch: "upgrade/openai-v2",
    base: "main",
    title: "Upgrade openai SDK",
  },
  evidence_summary: "12/12 tests pass post-migration; 0 legacy patterns remain.",
});

describe("approval state machine", () => {
  it("starts pending and resolves to exactly one decision", () => {
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));
    expect(approval.status).toBe("pending");

    const decided = store.decideApproval(approval.id, { decision: "approved", decided_by: "tester" });
    expect(decided.status).toBe("approved");
    expect(decided.decided_by).toBe("tester");

    expect(() => store.decideApproval(approval.id, { decision: "rejected", decided_by: "tester" })).toThrowError(
      MissionStoreError,
    );
    expect(store.getApproval(approval.id).status).toBe("approved");
  });

  it("rejects decisions for unknown approvals", () => {
    const { store } = startedStore();
    expect(() => store.decideApproval("nope", { decision: "approved", decided_by: "x" })).toThrowError(
      /unknown approval/,
    );
  });

  it("awaitApproval resolves early when the decision lands", async () => {
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));

    const started = Date.now();
    const pending = store.awaitApproval(approval.id, 30);
    setTimeout(() => store.decideApproval(approval.id, { decision: "approved", decided_by: "x" }), 50);
    const result = await pending;

    expect(result.status).toBe("approved");
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it("awaitApproval times out and reports pending", async () => {
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));
    const result = await store.awaitApproval(approval.id, 1);
    expect(result.status).toBe("pending");
  });

  it("a rejected approval never allows the PR to be recorded", () => {
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));
    store.decideApproval(approval.id, { decision: "rejected", decided_by: "x" });

    expect(() =>
      store.reportPrOpened({ mission_id: mission.id, pr_url: "https://github.com/x/y/pull/1", branch: "b" }),
    ).toThrowError(/no approved approval/);
  });
});

describe("mutation-before-approval guard", () => {
  it("refuses to record a PR when no approval exists at all", () => {
    const { store, mission } = startedStore();
    expect(() =>
      store.reportPrOpened({ mission_id: mission.id, pr_url: "https://github.com/x/y/pull/1", branch: "b" }),
    ).toThrowError(MissionStoreError);
  });

  it("records the PR once an approval is approved", () => {
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));
    store.decideApproval(approval.id, { decision: "approved", decided_by: "x" });
    store.reportPrOpened({ mission_id: mission.id, pr_url: "https://github.com/x/y/pull/7", branch: "upgrade/openai-v2" });
    expect(store.snapshot().pr?.pr_url).toBe("https://github.com/x/y/pull/7");
  });
});

describe("event log", () => {
  it("replays only events after the requested sequence", () => {
    const { store, mission } = startedStore();
    const seqAfterStart = store.lastSeq();
    store.reportStage({ mission_id: mission.id, stage: "running_baseline", status: "active" });
    store.reportStage({ mission_id: mission.id, stage: "running_baseline", status: "done" });

    const replay = store.eventsSince(seqAfterStart);
    expect(replay).toHaveLength(2);
    expect(replay.map((e) => e.type)).toEqual(["stage", "stage"]);
  });

  it("notifies live subscribers", () => {
    const { store, mission } = startedStore();
    const seen: string[] = [];
    const unsubscribe = store.subscribe((e) => seen.push(e.type));
    store.reportEvent({ mission_id: mission.id, kind: "info", message: "hello" });
    unsubscribe();
    store.reportEvent({ mission_id: mission.id, kind: "info", message: "ignored" });
    expect(seen).toEqual(["activity"]);
  });
});
