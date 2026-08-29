import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMissionClient, type MissionState } from "./missionClient";

type ConnectionState = "connecting" | "live" | "reconnecting";

/**
 * React adapter over the mission client: SSE events act purely as change
 * signals that trigger a debounced snapshot refresh, so replay, reconnects,
 * and replay-gap signals are all handled by the same code path.
 */
export function useMission() {
  const [state, setState] = useState<MissionState>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const refetchTimer = useRef<number | null>(null);

  const client = useMemo(
    () => createMissionClient({ fetchImpl: (input, init) => fetch(input, init), onState: setState }),
    [],
  );

  const scheduleRefresh = useCallback(() => {
    if (refetchTimer.current !== null) return;
    refetchTimer.current = window.setTimeout(() => {
      refetchTimer.current = null;
      void client.refresh();
    }, 120);
  }, [client]);

  useEffect(() => {
    void client.refresh();
    const source = new EventSource("/api/stream");
    const onAnyEvent = () => scheduleRefresh();
    // Named SSE events don't fire onmessage; listen to every type the server emits.
    for (const type of [
      "mission_started",
      "stage",
      "breaking_changes",
      "repo_analysis",
      "baseline",
      "verification",
      "migration_plan",
      "activity",
      "approval_requested",
      "approval_decided",
      "pr_opened",
      "replay_gap",
    ]) {
      source.addEventListener(type, onAnyEvent);
    }
    source.onopen = () => setConnection("live");
    source.onerror = () => setConnection("reconnecting");
    return () => source.close();
  }, [client, scheduleRefresh]);

  const decide = useCallback(
    (approvalId: string, decision: "approved" | "rejected") => client.decide(approvalId, decision),
    [client],
  );

  return { mission: state?.mission ?? null, status: state?.status ?? null, connection, decide };
}
