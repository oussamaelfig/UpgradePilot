import { useEffect, useRef, useState } from "react";
import type { Approval, Mission } from "../types";
import { ConsoleIcon } from "./ConsoleIcons";

type Decision = "approved" | "rejected";

export function ApprovalModal({
  mission,
  approval,
  onDecide,
}: {
  mission: Mission;
  approval: Approval;
  onDecide: (id: string, decision: Decision) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [busy, setBusy] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escapeHint, setEscapeHint] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const escapeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setError(null);
    setEscapeHint(false);
  }, [approval.id]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.focus();

    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setEscapeHint(true);
        if (escapeTimerRef.current !== null) window.clearTimeout(escapeTimerRef.current);
        escapeTimerRef.current = window.setTimeout(() => setEscapeHint(false), 3_000);
        return;
      }

      if (event.key !== "Tab") return;
      const elements = focusables();
      if (elements.length === 0) {
        // Both actions are disabled while a decision is in flight. Parking
        // focus on the neutral panel keeps Tab away from the page behind.
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    const containFocus = (event: FocusEvent) => {
      if (!panel.contains(event.target as Node)) panel.focus();
    };

    document.addEventListener("keydown", onKeydown, true);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("keydown", onKeydown, true);
      document.removeEventListener("focusin", containFocus);
      document.body.style.overflow = previousOverflow;
      if (escapeTimerRef.current !== null) window.clearTimeout(escapeTimerRef.current);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [approval.id]);

  const decide = async (decision: Decision) => {
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
  const changedFiles = mission.migration_plan?.files.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-modal-title"
        aria-describedby="approval-modal-description approval-modal-safety"
        aria-busy={busy !== null}
        tabIndex={-1}
        className="approval-sheet fixed inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-console-line bg-console-bg text-console-text shadow-2xl outline-none"
      >
        <header className="shrink-0 border-b border-console-line px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-console-warning/25 bg-console-warning-bg px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-console-warning">
              <ConsoleIcon name="warning" size={12} />
              Decision required
            </span>
            <span className="font-mono text-[10px] text-console-faint">{approval.id}</span>
          </div>
          <h2 id="approval-modal-title" className="text-xl font-semibold tracking-tight text-console-text">
            Approve external action
          </h2>
          <p id="approval-modal-description" className="mt-1 text-sm leading-5 text-console-muted">
            The agent is paused at the human gate. Review the exact action and deterministic evidence before
            allowing it to touch GitHub.
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section aria-labelledby="approval-action-title">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3
                id="approval-action-title"
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-console-faint"
              >
                Exact external action
              </h3>
              <span className="inline-flex items-center gap-1 font-mono text-[9px] text-console-warning">
                <span className="h-1.5 w-1.5 rounded-full bg-console-warning" aria-hidden="true" />
                pending
              </span>
            </div>
            <div className="overflow-hidden rounded-[10px] border border-console-line bg-console-panel">
              <dl className="divide-y divide-console-line text-xs">
                <ActionRow
                  label="Action"
                  value={approval.action.kind === "open_github_pr" ? "Open GitHub pull request" : approval.action.kind}
                  icon="external"
                />
                <ActionRow label="Repository" value={approval.action.repo} icon="repository" mono />
                <ActionRow
                  label="Branch"
                  value={`${approval.action.branch} → ${approval.action.base}`}
                  icon="branch"
                  mono
                />
                <ActionRow label="Title" value={approval.action.title} icon="file" />
              </dl>
              <p className="border-t border-console-line bg-console-panel-alt px-3 py-2 font-mono text-[9px] leading-4 text-console-faint">
                This payload is fixed. Approval authorizes this action only.
              </p>
            </div>
          </section>

          <section aria-labelledby="approval-proof-title" className="mt-5">
            <h3
              id="approval-proof-title"
              className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-console-faint"
            >
              Verification evidence
            </h3>
            <dl className="grid grid-cols-2 gap-2">
              <EvidenceStat
                label="Upgrade"
                value={`${mission.from_version ?? "?"} → ${mission.to_version ?? "?"}`}
              />
              <EvidenceStat
                label="Breaking changes"
                value={String(mission.breaking_changes?.breaking_changes.length ?? "—")}
              />
              <EvidenceStat
                label="Before"
                value={baseline ? `${baseline.failed + baseline.errors} failing` : "—"}
                tone="danger"
                sub={baseline ? `exit ${baseline.exit_code}` : undefined}
              />
              <EvidenceStat
                label="After"
                value={verification ? `${verification.passed}/${verification.total} pass` : "—"}
                tone="success"
                sub={
                  typeof verification?.legacy_patterns_remaining === "number"
                    ? `${verification.legacy_patterns_remaining} legacy sites left`
                    : undefined
                }
              />
            </dl>
          </section>

          <section aria-labelledby="approval-summary-title" className="mt-5">
            <h3
              id="approval-summary-title"
              className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-console-faint"
            >
              Evidence summary
            </h3>
            <div className="rounded-[10px] border border-console-line bg-console-panel p-3">
              <p className="whitespace-pre-line text-xs leading-5 text-console-muted">{approval.evidence_summary}</p>
              {/* Each chip is a factual claim: render it only when the mission
                  snapshot actually carries the evidence behind it. */}
              {(verification || typeof changedFiles === "number") && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-console-line pt-3">
                  {verification && <ProofChip icon="evidence" label="Test suite rerun" />}
                  {typeof verification?.legacy_patterns_remaining === "number" && (
                    <ProofChip icon="changes" label="Legacy scan complete" />
                  )}
                  {typeof changedFiles === "number" && (
                    <ProofChip icon="file" label={`${changedFiles} files in change set`} />
                  )}
                </div>
              )}
            </div>
          </section>

          <div
            id="approval-modal-safety"
            className="mt-5 flex gap-2.5 rounded-[10px] border border-console-info/20 bg-console-info-bg p-3 text-xs leading-5 text-console-info"
          >
            <ConsoleIcon name="info" size={15} className="mt-0.5 shrink-0" />
            <p>
              Keyboard safety is active. Focus stays inside this review, and Escape never approves, rejects, or
              dismisses the gate.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-[10px] border border-console-danger/25 bg-console-danger-bg px-3 py-2 text-xs leading-5 text-console-danger"
            >
              Your decision was not recorded: {error}
            </div>
          )}

          {escapeHint && (
            <div
              role="status"
              className="mt-3 rounded-[10px] border border-console-warning/25 bg-console-warning-bg px-3 py-2 text-xs text-console-warning"
            >
              Approval remains open. Choose Approve or Reject explicitly.
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-console-line bg-console-panel px-5 py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => void decide("rejected")}
              disabled={busy !== null}
              className="console-button console-button-danger sm:min-w-28"
            >
              {busy === "rejected" ? "Rejecting…" : "Reject"}
            </button>
            <button
              type="button"
              onClick={() => void decide("approved")}
              disabled={busy !== null}
              className="console-button console-button-primary sm:min-w-52"
            >
              <ConsoleIcon name="check" size={14} />
              {busy === "approved" ? "Approving…" : "Approve and open PR"}
            </button>
          </div>
          <p className="mt-2 text-right font-mono text-[9px] text-console-faint">
            No decision is bound to a keyboard shortcut.
          </p>
        </footer>
      </div>
    </div>
  );
}

function ActionRow({
  label,
  value,
  icon,
  mono = false,
}: {
  label: string;
  value: string;
  icon: "external" | "repository" | "branch" | "file";
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-console-faint">
        <ConsoleIcon name={icon} size={13} />
        {label}
      </dt>
      <dd className={`min-w-0 break-words text-console-text ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function EvidenceStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "text-console-danger"
      : tone === "success"
        ? "text-console-success"
        : "text-console-text";

  return (
    <div className="rounded-lg border border-console-line bg-console-panel p-3">
      <dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-console-faint">{label}</dt>
      <dd className={`mt-1 font-mono text-sm font-medium ${toneClass}`}>
        {value}
        {sub && <span className="mt-0.5 block font-mono text-[9px] font-normal text-console-faint">{sub}</span>}
      </dd>
    </div>
  );
}

function ProofChip({ icon, label }: { icon: "evidence" | "changes" | "file"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-console-line bg-console-panel-alt px-2 py-1 font-mono text-[9px] text-console-muted">
      <ConsoleIcon name={icon} size={11} className="text-console-success" />
      {label}
    </span>
  );
}
