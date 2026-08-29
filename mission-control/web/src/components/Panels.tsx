import type { Mission, TestRun } from "../types";

export function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel-enter rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-tertiary">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

const CHANGE_TYPE_STYLES: Record<string, string> = {
  removed: "bg-bad/10 text-bad-deep",
  renamed: "bg-warn/15 text-warn-deep",
  signature_changed: "bg-note/10 text-note-deep",
  config_changed: "bg-accent/10 text-accent",
  behavior_changed: "bg-gold/25 text-warn-deep",
};

export function BreakingChangesPanel({ mission }: { mission: Mission }) {
  const data = mission.breaking_changes;
  if (!data) return null;
  return (
    <Panel
      title={`Breaking changes (${data.breaking_changes.length})`}
      badge={
        <a
          href={data.source.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-ink-secondary transition-colors hover:text-accent"
          title={data.source.title}
        >
          {data.source.recovered && (
            <span className="rounded-sm bg-warn/15 px-1.5 py-0.5 font-semibold text-warn-deep">
              RECOVERED SOURCE
            </span>
          )}
          <span className="max-w-56 truncate">{data.source.title}</span>
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current">
            <path d="M4 2h6v6M10 2 5 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-ink-tertiary">
              <th className="pb-2 pr-4 font-medium">Symbol</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Before</th>
              <th className="pb-2 font-medium">After</th>
            </tr>
          </thead>
          <tbody className="align-top">
            {data.breaking_changes.map((change, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-2 pr-4 font-mono text-ink">{change.symbol}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${
                      CHANGE_TYPE_STYLES[change.change_type] ?? "bg-ink/5 text-ink-secondary"
                    }`}
                  >
                    {change.change_type}
                  </span>
                </td>
                <td className="py-2 pr-4 font-mono text-bad-deep/90">{change.before}</td>
                <td className="py-2 font-mono text-ok-deep">{change.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function AffectedFilesPanel({ mission }: { mission: Mission }) {
  const data = mission.repo_analysis;
  if (!data) return null;
  const totalSites = data.affected_files.reduce((sum, f) => sum + f.call_sites, 0);
  return (
    <Panel
      title={`Affected files (${data.affected_files.length})`}
      badge={<span className="font-mono text-xs text-ink-tertiary">{totalSites} call sites</span>}
    >
      <ul className="space-y-1.5">
        {data.affected_files.map((file) => (
          <li key={file.path} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-mono text-ink">{file.path}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="hidden max-w-64 truncate font-mono text-[10px] text-ink-tertiary md:inline">
                {file.symbols.join(", ")}
              </span>
              <span className="rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-secondary">
                {file.call_sites}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function TestRunCard({
  run,
  kind,
  packageName,
}: {
  run: TestRun;
  kind: "baseline" | "verification";
  packageName: string;
}) {
  const failedTotal = run.failed + run.errors;
  const good = kind === "verification" && failedTotal === 0 && run.exit_code === 0;
  const accent = good ? "ok" : failedTotal > 0 ? "bad" : "neutral";
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent === "ok"
          ? "border-ok/50 bg-ok/10"
          : accent === "bad"
            ? "border-bad/30 bg-bad/5"
            : "border-line bg-surface"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-secondary">
          {kind === "baseline" ? "Before migration" : "After migration"}
        </span>
        <span className="rounded-sm bg-white px-1.5 py-0.5 font-mono text-[10px] text-ink-secondary shadow-sm">
          {packageName} {run.installed_version}
        </span>
      </div>
      <div className="mb-2 flex items-end gap-4">
        <div>
          <p
            className={`font-mono text-xl font-bold leading-7 tracking-tight ${
              good ? "text-ok-deep" : failedTotal > 0 ? "text-bad-deep" : "text-ink"
            }`}
          >
            {failedTotal > 0 ? `${failedTotal} failing` : `${run.passed}/${run.total} pass`}
          </p>
          <p className="font-mono text-xs text-ink-secondary">
            {run.passed} passed · {run.failed} failed · {run.errors} errors
          </p>
        </div>
        {typeof run.legacy_patterns_remaining === "number" && (
          <div className="ml-auto text-right">
            <p
              className={`font-mono text-xl font-bold leading-7 tracking-tight ${
                run.legacy_patterns_remaining === 0 ? "text-ok-deep" : "text-bad-deep"
              }`}
            >
              {run.legacy_patterns_remaining}
            </p>
            <p className="text-[10px] text-ink-secondary">legacy call sites left</p>
          </div>
        )}
      </div>
      <div className="rounded-md bg-ink p-2.5">
        <p className="mb-1 font-mono text-[10px] text-white/40">
          $ {run.command} · exit {run.exit_code}
        </p>
        <pre className="max-h-24 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-4 text-white/75">
          {run.log_excerpt}
        </pre>
      </div>
    </div>
  );
}

export function BeforeAfterPanel({ mission }: { mission: Mission }) {
  if (!mission.baseline && !mission.verification) return null;
  // The dependency's bare name for evidence labels (mission.package may carry
  // an ecosystem suffix like "openai (Python)").
  const packageName = mission.package.split(" ")[0] ?? mission.package;
  return (
    <Panel title="Sandbox evidence — before / after">
      <div className="grid gap-3 lg:grid-cols-2">
        {mission.baseline ? (
          <TestRunCard run={mission.baseline} kind="baseline" packageName={packageName} />
        ) : (
          <div className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-ink-tertiary">
            baseline pending
          </div>
        )}
        {mission.verification ? (
          <TestRunCard run={mission.verification} kind="verification" packageName={packageName} />
        ) : (
          <div className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-ink-tertiary">
            verification pending
          </div>
        )}
      </div>
    </Panel>
  );
}

const ACTION_STYLES: Record<string, string> = {
  modify: "bg-warn/15 text-warn-deep",
  create: "bg-ok/15 text-ok-deep",
  delete: "bg-bad/10 text-bad-deep",
};

export function MigrationPlanPanel({ mission }: { mission: Mission }) {
  const plan = mission.migration_plan;
  if (!plan) return null;
  return (
    <Panel title={`Migration change set (${plan.files.length} files)`}>
      <ul className="space-y-1.5">
        {plan.files.map((file) => (
          <li key={file.path} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-0.5 shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${ACTION_STYLES[file.action]}`}
            >
              {file.action}
            </span>
            <span className="shrink-0 font-mono text-ink">{file.path}</span>
            <span className="truncate text-ink-secondary" title={file.summary}>
              — {file.summary}
            </span>
          </li>
        ))}
      </ul>
      {plan.notes && (
        <p className="mt-3 border-t border-line pt-2 text-xs leading-5 text-ink-secondary">{plan.notes}</p>
      )}
    </Panel>
  );
}

const ACTIVITY_ICONS: Record<string, string> = {
  info: "·",
  subagent: "⑂",
  tool: "⚙",
  warning: "!",
  recovery: "↻",
};

export function ActivityFeed({ mission }: { mission: Mission }) {
  if (mission.activity.length === 0) return null;
  const items = [...mission.activity].slice(-30).reverse();
  return (
    <Panel title="Agent activity">
      <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
        {items.map((item, i) => (
          <li key={`${item.ts}-${i}`} className="flex items-baseline gap-2 text-xs leading-5">
            <span
              className={`w-3 shrink-0 text-center font-mono ${
                item.kind === "warning"
                  ? "text-warn-deep"
                  : item.kind === "recovery"
                    ? "text-ok-deep"
                    : item.kind === "subagent"
                      ? "text-note-deep"
                      : "text-ink-tertiary"
              }`}
            >
              {ACTIVITY_ICONS[item.kind] ?? "·"}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-ink-tertiary">
              {new Date(item.ts).toLocaleTimeString([], { hour12: false })}
            </span>
            <span className={item.kind === "warning" ? "text-warn-deep" : "text-ink-secondary"}>
              {item.message}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function PrCard({ mission }: { mission: Mission }) {
  if (!mission.pr) return null;
  return (
    <section className="panel-enter rounded-lg bg-gradient-to-br from-blue-500 to-green-700 p-5 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <svg viewBox="0 0 16 16" className="h-5 w-5 fill-white">
            <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v5.256a2.251 2.251 0 1 0 1.5 0V5.372Zm-.75 7.878a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm7.5-2.872a2.25 2.25 0 1 0-1.5 0v.256a2.25 2.25 0 1 0 1.5 0v-.256ZM11 13.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Zm.75-9.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-md font-semibold">Migration PR opened</h2>
          <p className="text-sm text-white/80">
            branch <span className="font-mono text-white">{mission.pr.branch}</span> — verified changes,
            approved by a human
          </p>
        </div>
        <a
          href={mission.pr.pr_url}
          target="_blank"
          rel="noreferrer"
          className="btn ml-auto border-white bg-white font-semibold text-ink hover:border-white/70"
        >
          View pull request →
        </a>
      </div>
    </section>
  );
}
