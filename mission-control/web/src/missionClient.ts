import type { Mission, MissionStatus } from "./types";

export type MissionState = { mission: Mission; status: MissionStatus } | null;

type FetchLike = (input: string, init?: RequestInit) => Promise<{
  status: number;
  json(): Promise<unknown>;
}>;

/**
 * Transport-agnostic mission client. The React hook is a thin adapter over
 * this; all decision logic lives here where it is unit-testable.
 *
 * Staleness guard: concurrent refreshes can resolve out of order, so each
 * refresh takes a monotonically-increasing ticket and only the response
 * holding the latest ticket may update state — an older snapshot can never
 * overwrite a newer one (e.g. hide a just-requested approval).
 */
export function createMissionClient(options: {
  fetchImpl: FetchLike;
  onState: (state: MissionState) => void;
}) {
  const { fetchImpl, onState } = options;
  let latestTicket = 0;

  async function refresh(): Promise<void> {
    const ticket = ++latestTicket;
    try {
      const response = await fetchImpl("/api/mission");
      if (ticket !== latestTicket) return; // a newer refresh superseded this one
      if (response.status === 404) {
        onState(null);
        return;
      }
      const body = (await response.json()) as { mission: Mission; status: MissionStatus };
      if (ticket !== latestTicket) return;
      onState({ mission: body.mission, status: body.status });
    } catch {
      // transient; the next event or reconnect retries
    }
  }

  /**
   * Submit a decision. Failures are surfaced, never swallowed: an operator
   * must know their approval/rejection was not recorded.
   */
  async function decide(
    approvalId: string,
    decision: "approved" | "rejected",
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    let outcome: { ok: true } | { ok: false; error: string };
    try {
      const response = await fetchImpl(`/api/approvals/${approvalId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, decided_by: "human-operator" }),
      });
      if (response.status >= 200 && response.status < 300) {
        outcome = { ok: true };
      } else {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        outcome = { ok: false, error: body.error ?? `decision rejected (HTTP ${response.status})` };
      }
    } catch (error) {
      outcome = { ok: false, error: error instanceof Error ? error.message : "network failure" };
    }
    await refresh();
    return outcome;
  }

  return { refresh, decide };
}
