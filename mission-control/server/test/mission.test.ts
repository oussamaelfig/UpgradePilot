import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
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
    const pending = store.awaitApproval(mission.id, approval.id, 30);
    setTimeout(() => store.decideApproval(approval.id, { decision: "approved", decided_by: "x" }), 50);
    const result = await pending;

    expect(result.status).toBe("approved");
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it("awaitApproval times out and reports pending", async () => {
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));
    const result = await store.awaitApproval(mission.id, approval.id, 1);
    expect(result.status).toBe("pending");
  });

  it("awaitApproval refuses an approval belonging to another mission", async () => {
    // Regression test for a review finding: mission A must not be able to
    // satisfy its gate with mission B's approval.
    const store = new MissionStore();
    const missionA = store.startMission({ repo: "o/a", package: "openai" });
    const missionB = store.startMission({ repo: "o/b", package: "openai" });
    const approvalB = store.requestApproval(approvalInput(missionB.id));
    store.decideApproval(approvalB.id, { decision: "approved", decided_by: "x" });

    await expect(store.awaitApproval(missionA.id, approvalB.id, 1)).rejects.toThrowError(/belongs to mission/);
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

  it("records the PR once an approval is approved and the action matches", () => {
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));
    store.decideApproval(approval.id, { decision: "approved", decided_by: "x" });
    store.reportPrOpened({
      mission_id: mission.id,
      pr_url: "https://github.com/oussamaelfig/briefbot/pull/7",
      branch: "upgrade/openai-v2",
    });
    expect(store.snapshot().pr?.pr_url).toBe("https://github.com/oussamaelfig/briefbot/pull/7");
  });

  it("refuses to record a PR whose branch differs from the approved action", () => {
    // Regression test for a review finding: approval of one PR must not make
    // a different PR appear approved in the audit state.
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));
    store.decideApproval(approval.id, { decision: "approved", decided_by: "x" });
    expect(() =>
      store.reportPrOpened({
        mission_id: mission.id,
        pr_url: "https://github.com/oussamaelfig/briefbot/pull/8",
        branch: "some-other-branch",
      }),
    ).toThrowError(/does not match any approved action/);
  });

  it("refuses to record a PR under a repository other than the approved one", () => {
    const { store, mission } = startedStore();
    const approval = store.requestApproval(approvalInput(mission.id));
    store.decideApproval(approval.id, { decision: "approved", decided_by: "x" });
    expect(() =>
      store.reportPrOpened({
        mission_id: mission.id,
        pr_url: "https://github.com/attacker/elsewhere/pull/1",
        branch: "upgrade/openai-v2",
      }),
    ).toThrowError(/does not match any approved action/);
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

describe("persistence", () => {
  it("survives a restart via the state file", () => {
    const dir = mkdtempSync(join(tmpdir(), "mc-persist-"));
    const file = join(dir, "state.json");
    const store = new MissionStore(file);
    const mission = store.startMission({ repo: "o/r", package: "openai" });
    store.reportStage({ mission_id: mission.id, stage: "running_baseline", status: "active" });

    const reloaded = new MissionStore(file);
    expect(reloaded.activeMission().id).toBe(mission.id);
    expect(reloaded.lastSeq()).toBe(store.lastSeq());
  });

  it("never half-loads a structurally invalid snapshot", () => {
    // Regression test for a review finding: a parseable snapshot whose fields
    // are invalid (active mission pointing nowhere, missions non-iterable)
    // must not leave partial state like hasActiveMission() === true.
    const dir = mkdtempSync(join(tmpdir(), "mc-invalid-"));
    const file = join(dir, "state.json");
    writeFileSync(file, JSON.stringify({ seq: 9, activeMissionId: "missing", missions: "not-a-list", events: [] }));

    const store = new MissionStore(file);
    expect(store.hasActiveMission()).toBe(false);
    expect(() => store.activeMission()).toThrowError(/no active mission/);
  });

  it("backs up a corrupt state file instead of silently discarding it", () => {
    // Regression test for a review finding: read/parse failures must be
    // reported and the unreadable snapshot preserved for inspection.
    const dir = mkdtempSync(join(tmpdir(), "mc-corrupt-"));
    const file = join(dir, "state.json");
    writeFileSync(file, "{ this is not json");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const store = new MissionStore(file);
    expect(store.hasActiveMission()).toBe(false);
    expect(errorSpy).toHaveBeenCalledOnce();

    const backups = readdirSync(dir).filter((name) => name.includes(".corrupt-"));
    expect(backups).toHaveLength(1);
    expect(readFileSync(join(dir, backups[0]!), "utf-8")).toBe("{ this is not json");
    errorSpy.mockRestore();
  });
});
