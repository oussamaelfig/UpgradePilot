import { useEffect, useState } from "react";
import type { Approval, Mission } from "../types";

export function ApprovalModal({
  mission,
  approval,
  onDecide,
}: {
  mission: Mission;
  approval: Approval;
  onDecide: (id: string, decision: "approved" | "rejected") => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A failure message belongs to one approval only; never carry it over when
  // the modal re-renders for a different pending approval.
  useEffect(() => setError(null), [approval.id]);

  const decide = async (decision: "approved" | "rejected") => {
    setBusy(decision);
    setError(null);
    try {
      const outcome = await onDecide(approval.id, decision);
      if (!outcome.ok) setError(outcome.error);
    } finally {
      setBusy(null);
    }
  };

  const verification = mission.verification;
  const baseline = mission.baseline;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="panel-enter max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warn/15">
            <svg viewBox="0 0 16 16" className="h-5 w-5 fill-warn-deep">
              <path d="M8 1.5a1.75 1.75 0 0 0-1.52.88L.7 12.55A1.75 1.75 0 0 0 2.22 15h11.56a1.75 1.75 0 0 0 1.52-2.45L9.52 2.38A1.75 1.75 0 0 0 8 1.5Zm.75 4.75a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3ZM8 12.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-md font-semibold tracking-tight text-ink">Human approval required</h2>
            <p className="text-sm text-ink-secondary">
              The agent is paused. Nothing touches the real repository until you decide.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-ink p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Exact external action
          </p>
          <p className="font-mono text-base leading-6 text-white/90">
            {approval.action.kind === "open_github_pr" ? "Open pull request" : approval.action.kind} on{" "}
            <span className="text-[#7db8ff]">{approval.action.repo}</span>
            <br />
            <span className="text-white/40">branch</span>{" "}
            <span className="text-[#a5e082]">{approval.action.branch}</span>{" "}
            <span className="text-white/40">→</span> <span className="text-white/90">{approval.action.base}</span>
            <br />
            <span className="text-white/40">title</span> “{approval.action.title}”
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Upgrade" value={`${mission.from_version ?? "?"} → ${mission.to_version ?? "?"}`} />
          <Stat
            label="Breaking changes"
            value={String(mission.breaking_changes?.breaking_changes.length ?? "—")}
          />
          <Stat
            label="Before"
            value={baseline ? `${baseline.failed + baseline.errors} failing` : "—"}
            tone="bad"
          />
          <Stat
            label="After"
            value={verification ? `${verification.passed}/${verification.total} pass` : "—"}
            tone="ok"
            sub={
              typeof verification?.legacy_patterns_remaining === "number"
                ? `${verification.legacy_patterns_remaining} legacy sites left`
                : undefined
            }
          />
        </div>

        <div className="mb-5 rounded-lg border border-line bg-surface p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
            Evidence summary
          </p>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-5 text-ink-secondary">
            {approval.evidence_summary}
          </pre>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad-deep">
            Your decision was not recorded: {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => void decide("approved")}
            disabled={busy !== null}
            className="btn btn-blue btn-lg flex-1 font-semibold"
          >
            {busy === "approved" ? "Approving…" : "Approve — open the PR"}
          </button>
          <button
            onClick={() => void decide("rejected")}
            disabled={busy !== null}
            className="btn btn-lg flex-1 border-bad/30 font-semibold text-bad-deep hover:border-bad/60"
          >
            {busy === "rejected" ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "bad" | "ok";
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">{label}</p>
      <p
        className={`mt-1 font-mono text-base font-semibold ${
          tone === "bad" ? "text-bad-deep" : tone === "ok" ? "text-ok-deep" : "text-ink"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-ink-secondary">{sub}</p>}
    </div>
  );
}
