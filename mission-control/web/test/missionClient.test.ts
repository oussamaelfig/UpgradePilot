import { describe, expect, it } from "vitest";
import { createMissionClient, type MissionState } from "../src/missionClient";

type Deferred = {
  resolve: (value: { status: number; json(): Promise<unknown> }) => void;
  promise: Promise<{ status: number; json(): Promise<unknown> }>;
};

function deferred(): Deferred {
  let resolve!: Deferred["resolve"];
  const promise = new Promise<{ status: number; json(): Promise<unknown> }>((r) => {
    resolve = r;
  });
  return { resolve, promise };
}

function jsonResponse(payload: unknown) {
  return { status: 200, json: () => Promise.resolve(payload) };
}

const missionPayload = (id: string) => ({
  mission: { id, title: "t", repo: "o/r", package: "openai" },
  status: { label: "RUNNING", kind: "active" },
});

describe("mission client staleness guard", () => {
  it("an older refresh resolving late cannot overwrite a newer snapshot", async () => {
    // Regression test for a review finding: out-of-order responses must not
    // replace current state (e.g. hide a pending approval modal).
    const pending: Deferred[] = [];
    const states: MissionState[] = [];
    const client = createMissionClient({
      fetchImpl: () => {
        const d = deferred();
        pending.push(d);
        return d.promise;
      },
      onState: (s) => states.push(s),
    });

    const first = client.refresh(); // ticket 1 (older)
    const second = client.refresh(); // ticket 2 (newer)

    pending[1]!.resolve(jsonResponse(missionPayload("newer")));
    await second;
    pending[0]!.resolve(jsonResponse(missionPayload("older")));
    await first;

    expect(states.map((s) => s?.mission.id)).toEqual(["newer"]);
  });

  it("maps 404 to the empty state", async () => {
    const states: MissionState[] = [];
    const client = createMissionClient({
      fetchImpl: () => Promise.resolve({ status: 404, json: () => Promise.resolve({}) }),
      onState: (s) => states.push(s),
    });
    await client.refresh();
    expect(states).toEqual([null]);
  });

  it("swallows transport failures and keeps previous state", async () => {
    const states: MissionState[] = [];
    const client = createMissionClient({
      fetchImpl: () => Promise.reject(new Error("network down")),
      onState: (s) => states.push(s),
    });
    await expect(client.refresh()).resolves.toBeUndefined();
    expect(states).toEqual([]);
  });

  it("decide posts the decision then refreshes", async () => {
    const calls: { input: string; init?: RequestInit }[] = [];
    const client = createMissionClient({
      fetchImpl: (input, init) => {
        calls.push({ input, init });
        return Promise.resolve(jsonResponse(missionPayload("m")));
      },
      onState: () => {},
    });
    await client.decide("abc", "approved");

    expect(calls[0]!.input).toBe("/api/approvals/abc/decision");
    expect(JSON.parse(String(calls[0]!.init?.body))).toMatchObject({ decision: "approved" });
    expect(calls[1]!.input).toBe("/api/mission");
  });
});
