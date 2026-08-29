import { useCallback, useEffect, useRef, useState } from "react";
import type { Mission } from "./types";

type ConnectionState = "connecting" | "live" | "reconnecting";

/**
 * Mission state = always the server-truth snapshot. SSE events trigger a
 * debounced snapshot refetch; the stream itself is only a change signal, so
 * replay/reconnect correctness is trivial.
 */
export function useMission() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const refetchTimer = useRef<number | null>(null);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/mission");
      if (response.status === 404) {
        setMission(null);
        return;
      }
      const body = await response.json();
      setMission(body.mission);
    } catch {
      // transient; the next event or reconnect retries
    }
  }, []);

  const scheduleRefetch = useCallback(() => {
    if (refetchTimer.current !== null) return;
    refetchTimer.current = window.setTimeout(() => {
      refetchTimer.current = null;
      void refetch();
    }, 120);
  }, [refetch]);

  useEffect(() => {
    void refetch();
    const source = new EventSource("/api/stream");
    const onAnyEvent = () => scheduleRefetch();
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
    ]) {
      source.addEventListener(type, onAnyEvent);
    }
    source.onopen = () => setConnection("live");
    source.onerror = () => setConnection("reconnecting");
    return () => source.close();
  }, [refetch, scheduleRefetch]);

  const decide = useCallback(
    async (approvalId: string, decision: "approved" | "rejected") => {
      await fetch(`/api/approvals/${approvalId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, decided_by: "human-operator" }),
      });
      await refetch();
    },
    [refetch],
  );

  return { mission, connection, decide };
}
