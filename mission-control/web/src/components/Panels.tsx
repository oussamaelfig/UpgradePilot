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
    <section className="panel-enter rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

const CHANGE_TYPE_STYLES: Record<string, string> = {
  removed: "bg-red-500/15 text-red-300",
  renamed: "bg-amber-500/15 text-amber-300",
  signature_changed: "bg-violet-500/15 text-violet-300",
  config_changed: "bg-sky-500/15 text-sky-300",
  behavior_changed: "bg-orange-500/15 text-orange-300",
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
          className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-sky-300"
          title={data.source.title}
        >
          {data.source.recovered && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-300">
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
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-zinc-600">
              <th className="pb-2 pr-4 font-medium">Symbol</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Before</th>
              <th className="pb-2 font-medium">After</th>
            </tr>
          </thead>
          <tbody className="align-top">
            {data.breaking_changes.map((change, i) => (
              <tr key={i} className="border-t border-zinc-800/70">
                <td className="py-2 pr-4 font-mono text-zinc-200">{change.symbol}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      CHANGE_TYPE_STYLES[change.change_type] ?? "bg-zinc-700/40 text-zinc-300"
                    }`}
                  >
                    {change.change_type}
                  </span>
                </td>
                <td className="py-2 pr-4 font-mono text-red-300/90">{change.before}</td>
                <td className="py-2 font-mono text-emerald-300/90">{change.after}</td>
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
      badge={<span className="font-mono text-[11px] text-zinc-500">{totalSites} call sites</span>}
    >
      <ul className="space-y-1.5">
        {data.affected_files.map((file) => (
          <li key={file.path} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="truncate font-mono text-zinc-300">{file.path}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="hidden max-w-64 truncate font-mono text-[10px] text-zinc-600 md:inline">
                {file.symbols.join(", ")}
              </span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                {file.call_sites}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function TestRunCard({ run, kind }: { run: TestRun; kind: "baseline" | "verification" }) {
  const failedTotal = run.failed + run.errors;
  const good = kind === "verification" && failedTotal === 0 && run.exit_code === 0;
  const accent = good ? "emerald" : failedTotal > 0 ? "red" : "zinc";
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent === "emerald"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : accent === "red"
            ? "border-red-500/30 bg-red-500/5"
            : "border-zinc-800 bg-zinc-900/60"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {kind === "baseline" ? "Before migration" : "After migration"}
        </span>
        <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
          openai {run.installed_version}
        </span>
      </div>
      <div className="mb-2 flex items-end gap-4">
        <div>
          <p className={`font-mono text-2xl font-bold leading-7 ${good ? "text-emerald-300" : failedTotal > 0 ? "text-red-300" : "text-zinc-200"}`}>
            {failedTotal > 0 ? `${failedTotal} failing` : `${run.passed}/${run.total} pass`}
          </p>
          <p className="font-mono text-[11px] text-zinc-500">
            {run.passed} passed · {run.failed} failed · {run.errors} errors
          </p>
        </div>
        {typeof run.legacy_patterns_remaining === "number" && (
          <div className="ml-auto text-right">
            <p className={`font-mono text-2xl font-bold leading-7 ${run.legacy_patterns_remaining === 0 ? "text-emerald-300" : "text-red-300"}`}>
              {run.legacy_patterns_remaining}
            </p>
            <p className="text-[10px] text-zinc-500">legacy call sites left</p>
          </div>
        )}
      </div>
      <div className="rounded-md bg-zinc-950/80 p-2 ring-1 ring-zinc-800">
        <p className="mb-1 font-mono text-[10px] text-zinc-600">$ {run.command} · exit {run.exit_code}</p>
        <pre className="max-h-24 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-4 text-zinc-400">
          {run.log_excerpt}
        </pre>
      </div>
    </div>
  );
}

export function BeforeAfterPanel({ mission }: { mission: Mission }) {
  if (!mission.baseline && !mission.verification) return null;
  return (
    <Panel title="Sandbox evidence — before / after">
      <div className="grid gap-3 lg:grid-cols-2">
        {mission.baseline ? (
          <TestRunCard run={mission.baseline} kind="baseline" />
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-[11px] text-zinc-600">
            baseline pending
          </div>
        )}
        {mission.verification ? (
          <TestRunCard run={mission.verification} kind="verification" />
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-[11px] text-zinc-600">
            verification pending
          </div>
        )}
      </div>
    </Panel>
  );
}

const ACTION_STYLES: Record<string, string> = {
  modify: "bg-amber-500/15 text-amber-300",
  create: "bg-emerald-500/15 text-emerald-300",
  delete: "bg-red-500/15 text-red-300",
};

export function MigrationPlanPanel({ mission }: { mission: Mission }) {
  const plan = mission.migration_plan;
  if (!plan) return null;
  return (
    <Panel title={`Migration change set (${plan.files.length} files)`}>
      <ul className="space-y-1.5">
        {plan.files.map((file) => (
          <li key={file.path} className="flex items-start gap-2 text-[12px]">
            <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${ACTION_STYLES[file.action]}`}>
              {file.action}
            </span>
            <span className="shrink-0 font-mono text-zinc-300">{file.path}</span>
            <span className="truncate text-zinc-500" title={file.summary}>
              — {file.summary}
            </span>
          </li>
        ))}
      </ul>
      {plan.notes && <p className="mt-3 border-t border-zinc-800/70 pt-2 text-[11px] leading-5 text-zinc-500">{plan.notes}</p>}
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
          <li key={`${item.ts}-${i}`} className="flex items-baseline gap-2 text-[11px] leading-5">
            <span
              className={`w-3 shrink-0 text-center font-mono ${
                item.kind === "warning"
                  ? "text-amber-400"
                  : item.kind === "recovery"
                    ? "text-emerald-400"
                    : item.kind === "subagent"
                      ? "text-violet-400"
                      : "text-zinc-600"
              }`}
            >
              {ACTIVITY_ICONS[item.kind] ?? "·"}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-600">
              {new Date(item.ts).toLocaleTimeString([], { hour12: false })}
            </span>
            <span className={item.kind === "warning" ? "text-amber-200/90" : "text-zinc-400"}>{item.message}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function PrCard({ mission }: { mission: Mission }) {
  if (!mission.pr) return null;
  return (
    <section className="panel-enter rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-sky-500/5 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/50">
          <svg viewBox="0 0 16 16" className="h-5 w-5 fill-emerald-300">
            <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v5.256a2.251 2.251 0 1 0 1.5 0V5.372Zm-.75 7.878a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm7.5-2.872a2.25 2.25 0 1 0-1.5 0v.256a2.25 2.25 0 1 0 1.5 0v-.256ZM11 13.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Zm.75-9.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-emerald-200">Migration PR opened</h2>
          <p className="text-[12px] text-zinc-400">
            branch <span className="font-mono text-zinc-300">{mission.pr.branch}</span> — verified changes, approved by a human
          </p>
        </div>
        <a
          href={mission.pr.pr_url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-lg bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          View pull request →
        </a>
      </div>
    </section>
  );
}
