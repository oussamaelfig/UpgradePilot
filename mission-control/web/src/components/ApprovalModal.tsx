import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
      <div className="panel-enter max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-500/30 bg-zinc-900 p-6 shadow-2xl shadow-amber-500/5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-400/50">
            <svg viewBox="0 0 16 16" className="h-5 w-5 fill-amber-300">
              <path d="M8 1.5a1.75 1.75 0 0 0-1.52.88L.7 12.55A1.75 1.75 0 0 0 2.22 15h11.56a1.75 1.75 0 0 0 1.52-2.45L9.52 2.38A1.75 1.75 0 0 0 8 1.5Zm.75 4.75a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3ZM8 12.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-zinc-100">Human approval required</h2>
            <p className="text-[12px] text-zinc-500">
              The agent is paused. Nothing touches the real repository until you decide.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Exact external action</p>
          <p className="font-mono text-[13px] leading-6 text-zinc-200">
            {approval.action.kind === "open_github_pr" ? "Open pull request" : approval.action.kind} on{" "}
            <span className="text-sky-300">{approval.action.repo}</span>
            <br />
            <span className="text-zinc-500">branch</span> <span className="text-emerald-300">{approval.action.branch}</span>{" "}
            <span className="text-zinc-500">→</span> <span className="text-zinc-300">{approval.action.base}</span>
            <br />
            <span className="text-zinc-500">title</span> “{approval.action.title}”
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Upgrade" value={`${mission.from_version ?? "?"} → ${mission.to_version ?? "?"}`} />
          <Stat label="Breaking changes" value={String(mission.breaking_changes?.breaking_changes.length ?? "—")} />
          <Stat
            label="Before"
            value={baseline ? `${baseline.failed + baseline.errors} failing` : "—"}
            tone="red"
          />
          <Stat
            label="After"
            value={verification ? `${verification.passed}/${verification.total} pass` : "—"}
            tone="emerald"
            sub={
              typeof verification?.legacy_patterns_remaining === "number"
                ? `${verification.legacy_patterns_remaining} legacy sites left`
                : undefined
            }
          />
        </div>

        <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Evidence summary</p>
          <pre className="whitespace-pre-wrap font-sans text-[12px] leading-5 text-zinc-300">
            {approval.evidence_summary}
          </pre>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            Your decision was not recorded: {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => void decide("approved")}
            disabled={busy !== null}
            className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-[14px] font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy === "approved" ? "Approving…" : "Approve — open the PR"}
          </button>
          <button
            onClick={() => void decide("rejected")}
            disabled={busy !== null}
            className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-[14px] font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
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
  tone?: "red" | "emerald";
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
      <p
        className={`mt-1 font-mono text-[13px] font-semibold ${
          tone === "red" ? "text-red-300" : tone === "emerald" ? "text-emerald-300" : "text-zinc-200"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-zinc-500">{sub}</p>}
    </div>
  );
}
