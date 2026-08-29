import type { Mission, TestRun } from "../types";
import { ConsoleIcon, type ConsoleIconName } from "./ConsoleIcons";

export function Panel({
  id,
  title,
  icon,
  badge,
  children,
  className = "",
  bodyClassName = "p-3",
}: {
  id?: string;
  title: string;
  icon?: ConsoleIconName;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      id={id}
      className={`panel-enter scroll-mt-24 overflow-hidden rounded-[10px] border border-console-line bg-console-panel ${className}`}
    >
      <div className="flex h-10 items-center justify-between gap-3 border-b border-console-line px-3">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium text-console-text">
          {icon && <ConsoleIcon name={icon} size={15} className="shrink-0 text-console-muted" />}
          <span className="truncate">{title}</span>
        </h2>
        {badge}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

const CHANGE_TYPE_STYLES: Record<string, string> = {
  removed: "border-console-danger/20 bg-console-danger-bg text-console-danger",
  renamed: "border-console-warning/20 bg-console-warning-bg text-console-warning",
  signature_changed: "border-console-info/20 bg-console-info-bg text-console-info",
  config_changed: "border-console-info/20 bg-console-info-bg text-console-info",
  behavior_changed: "border-console-warning/20 bg-console-warning-bg text-console-warning",
};

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-console-line bg-console-subtle px-1.5 py-0.5 font-mono text-[10px] text-console-muted">
      {children}
    </span>
  );
}

export function BreakingChangesPanel({ mission }: { mission: Mission }) {
  const data = mission.breaking_changes;
  if (!data) return null;

  return (
    <Panel
      id="breaking-changes"
      title="Breaking changes"
      icon="changes"
      badge={<CountBadge>{data.breaking_changes.length}</CountBadge>}
      bodyClassName="p-0"
    >
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-console-line px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-console-faint">
          Publisher source
        </span>
        <a
          href={data.source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-0 items-center gap-1.5 text-xs text-console-muted hover:text-console-text hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70"
          title={data.source.title}
        >
          {data.source.recovered && (
            <span className="shrink-0 rounded border border-console-warning/20 bg-console-warning-bg px-1.5 py-0.5 font-mono text-[9px] uppercase text-console-warning">
              recovered
            </span>
          )}
          <span className="max-w-64 truncate">{data.source.title}</span>
          <ConsoleIcon name="external" size={12} className="shrink-0" />
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[580px] table-fixed text-left text-xs">
          <thead className="bg-console-table-head">
            <tr className="font-mono text-[10px] uppercase tracking-[0.08em] text-console-faint">
              <th scope="col" className="w-[30%] px-3 py-2 font-normal">
                Symbol
              </th>
              <th scope="col" className="w-[20%] px-3 py-2 font-normal">
                Type
              </th>
              <th scope="col" className="px-3 py-2 font-normal">
                Required migration
              </th>
            </tr>
          </thead>
          <tbody>
            {data.breaking_changes.map((change, index) => (
              <tr key={`${change.symbol}-${index}`} className="group border-t border-console-line">
                <td className="px-3 py-2 align-top font-mono text-console-text">{change.symbol}</td>
                <td className="px-3 py-2 align-top">
                  <span
                    className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[9px] ${
                      CHANGE_TYPE_STYLES[change.change_type] ??
                      "border-console-line bg-console-subtle text-console-muted"
                    }`}
                  >
                    {change.change_type}
                  </span>
                </td>
                <td className="px-3 py-2 align-top font-mono text-[10px] leading-4">
                  <span className="block truncate text-console-danger/90" title={change.before}>
                    <span className="mr-1 text-console-faint" aria-hidden="true">
                      −
                    </span>
                    {change.before}
                  </span>
                  <span className="block truncate text-console-success" title={change.after}>
                    <span className="mr-1 text-console-faint" aria-hidden="true">
                      +
                    </span>
                    {change.after}
                  </span>
                </td>
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
  const totalSites = data.affected_files.reduce((sum, file) => sum + file.call_sites, 0);

  return (
    <Panel
      id="affected-files"
      title="Affected files"
      icon="impact"
      badge={<CountBadge>{totalSites} call sites</CountBadge>}
      bodyClassName="p-0"
    >
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sr-only">
          <tr>
            <th scope="col">File</th>
            <th scope="col">Call sites</th>
          </tr>
        </thead>
        <tbody>
          {data.affected_files.map((file) => (
            <tr key={file.path} className="border-b border-console-line last:border-b-0">
              <td className="min-w-0 px-3 py-2">
                <span
                  className="block truncate font-mono text-console-text"
                  title={`${file.path} — ${file.symbols.join(", ")}`}
                >
                  {file.path}
                </span>
                <span className="sr-only">
                  {file.symbols.join(", ")}
                </span>
              </td>
              <td className="w-12 px-3 py-2 text-right">
                <CountBadge>{file.call_sites}</CountBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const verified = kind === "verification" && failedTotal === 0 && run.exit_code === 0;
  const tone =
    verified
      ? {
          border: "border-console-success/25",
          surface: "bg-console-success-bg/45",
          text: "text-console-success",
          dot: "bg-console-success",
          label: "Verified",
        }
      : failedTotal > 0
        ? {
            border: "border-console-danger/25",
            surface: "bg-console-danger-bg/45",
            text: "text-console-danger",
            dot: "bg-console-danger",
            label: "Failure reproduced",
          }
        : {
            border: "border-console-line",
            surface: "bg-console-panel-alt",
            text: "text-console-text",
            dot: "bg-console-muted",
            label: "Completed",
          };

  return (
    <article className={`min-w-0 overflow-hidden rounded-lg border ${tone.border} ${tone.surface}`}>
      <div className="flex items-center justify-between gap-2 border-b border-console-line px-3 py-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-console-text">
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
          {kind === "baseline" ? "Before migration" : "After migration"}
        </span>
        <span className="rounded border border-console-line bg-console-panel px-1.5 py-0.5 font-mono text-[9px] text-console-muted">
          {packageName} {run.installed_version}
        </span>
      </div>

      <div className="px-3 pb-2.5 pt-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className={`font-mono text-lg font-semibold tracking-tight ${tone.text}`}>
              {failedTotal > 0 ? `${failedTotal} failing` : `${run.passed}/${run.total} pass`}
            </p>
            <p className="font-mono text-[9px] leading-4 text-console-faint">
              {run.passed} passed · {run.failed} failed · {run.errors} errors
            </p>
          </div>
          <span className={`rounded border ${tone.border} px-1.5 py-0.5 font-mono text-[9px] uppercase ${tone.text}`}>
            {tone.label}
          </span>
        </div>

        <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-console-line bg-console-line font-mono text-[9px]">
          <div className="bg-console-panel px-2 py-1.5">
            <dt className="text-console-faint">Exit code</dt>
            <dd className={run.exit_code === 0 ? "text-console-success" : "text-console-danger"}>
              {run.exit_code}
            </dd>
          </div>
          <div className="bg-console-panel px-2 py-1.5">
            <dt className="text-console-faint">Legacy sites</dt>
            <dd
              className={
                run.legacy_patterns_remaining === 0 ? "text-console-success" : "text-console-text"
              }
            >
              {typeof run.legacy_patterns_remaining === "number" ? run.legacy_patterns_remaining : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-2 overflow-hidden rounded-md border border-console-line bg-console-code">
          <div className="flex items-center gap-2 border-b border-console-line px-2 py-1 font-mono text-[9px] text-console-faint">
            <ConsoleIcon name="tool" size={11} />
            <span className="truncate" title={run.command}>
              {run.command}
            </span>
          </div>
          <pre className="max-h-16 overflow-auto whitespace-pre-wrap px-2 py-1.5 font-mono text-[9px] leading-[13px] text-console-muted">
            {run.log_excerpt}
          </pre>
        </div>
      </div>
    </article>
  );
}

/** One success predicate for "verified" wording: clean exit, zero failures
 *  and errors, and no legacy call sites left by the scan. */
export function verificationClean(run: TestRun | undefined): boolean {
  return (
    !!run &&
    run.exit_code === 0 &&
    run.failed + run.errors === 0 &&
    (run.legacy_patterns_remaining ?? 0) === 0
  );
}

export function BeforeAfterPanel({ mission }: { mission: Mission }) {
  if (!mission.baseline && !mission.verification) return null;
  const packageName = mission.package.split(" ")[0] ?? mission.package;

  return (
    <Panel
      id="evidence"
      title="Deterministic test evidence"
      icon="evidence"
      badge={
        verificationClean(mission.verification) ? (
          <span className="inline-flex items-center gap-1 rounded border border-console-success/20 bg-console-success-bg px-1.5 py-0.5 font-mono text-[9px] uppercase text-console-success">
            <ConsoleIcon name="check" size={10} />
            verified
          </span>
        ) : undefined
      }
    >
      <div className="grid gap-2 min-[1180px]:grid-cols-2">
        {mission.baseline ? (
          <TestRunCard run={mission.baseline} kind="baseline" packageName={packageName} />
        ) : (
          <EvidencePending label="Baseline pending" />
        )}
        {mission.verification ? (
          <TestRunCard run={mission.verification} kind="verification" packageName={packageName} />
        ) : (
          <EvidencePending label="Verification pending" />
        )}
      </div>
    </Panel>
  );
}

function EvidencePending({ label }: { label: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-console-line bg-console-panel-alt p-6 text-xs text-console-faint">
      {label}
    </div>
  );
}

const ACTION_STYLES: Record<string, string> = {
  modify: "border-console-warning/20 bg-console-warning-bg text-console-warning",
  create: "border-console-success/20 bg-console-success-bg text-console-success",
  delete: "border-console-danger/20 bg-console-danger-bg text-console-danger",
};

export function MigrationPlanPanel({ mission }: { mission: Mission }) {
  const plan = mission.migration_plan;
  if (!plan) return null;

  return (
    <Panel
      id="migration-plan"
      title="Migration changes"
      icon="file"
      badge={<CountBadge>{plan.files.length} files</CountBadge>}
      bodyClassName="p-0"
    >
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sr-only">
          <tr>
            <th scope="col">Action</th>
            <th scope="col">File and summary</th>
          </tr>
        </thead>
        <tbody>
          {plan.files.map((file) => (
            <tr key={file.path} className="border-b border-console-line last:border-b-0">
              <td className="w-[68px] px-3 py-2 align-top">
                <span
                  className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[9px] ${ACTION_STYLES[file.action]}`}
                >
                  {file.action}
                </span>
              </td>
              <td className="min-w-0 py-2 pr-3">
                <span
                  className="block truncate font-mono text-console-text"
                  title={`${file.path} — ${file.summary}`}
                >
                  {file.path}
                  <span className="font-sans text-console-faint"> — {file.summary}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {plan.notes && (
        <p className="border-t border-console-line px-3 py-2 text-[10px] leading-4 text-console-muted">
          {plan.notes}
        </p>
      )}
    </Panel>
  );
}

const ACTIVITY_ICONS: Record<string, ConsoleIconName> = {
  info: "info",
  subagent: "agent",
  tool: "tool",
  warning: "warning",
  recovery: "changes",
};

const ACTIVITY_STYLES: Record<string, string> = {
  warning: "text-console-warning",
  recovery: "text-console-success",
  subagent: "text-console-info",
  tool: "text-console-muted",
  info: "text-console-faint",
};

export function ActivityFeed({ mission, connection }: { mission: Mission; connection: string }) {
  if (mission.activity.length === 0) return null;
  const items = [...mission.activity].slice(-30).reverse();
  const live = connection === "live";

  return (
    <Panel
      id="activity"
      title="Agent activity"
      icon="activity"
      badge={
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase ${
            live ? "text-console-success" : "text-console-warning"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${live ? "bg-console-success" : "bg-console-warning"}`}
            aria-hidden="true"
          />
          {live ? "streaming" : "reconnecting"}
        </span>
      }
      bodyClassName="p-0"
    >
      <ol className="max-h-40 overflow-y-auto">
        {items.map((item, index) => (
          <li
            key={`${item.ts}-${index}`}
            className="grid grid-cols-[16px_46px_1fr] gap-2 border-b border-console-line px-3 py-2 text-[10px] leading-4 last:border-b-0"
          >
            <ConsoleIcon
              name={ACTIVITY_ICONS[item.kind] ?? "info"}
              size={13}
              className={`mt-0.5 ${ACTIVITY_STYLES[item.kind] ?? "text-console-faint"}`}
            />
            <time dateTime={item.ts} className="font-mono text-console-faint">
              {new Date(item.ts).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </time>
            <span className={item.kind === "warning" ? "text-console-warning" : "text-console-muted"}>
              {item.message}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function PrCard({ mission }: { mission: Mission }) {
  if (!mission.pr) return null;

  return (
    <section
      aria-labelledby="pr-opened-title"
      className="panel-enter flex flex-col gap-3 rounded-[10px] border border-console-success/25 bg-console-success-bg px-4 py-3 sm:flex-row sm:items-center"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-console-success/25 bg-console-panel text-console-success">
        <ConsoleIcon name="check" size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="pr-opened-title" className="text-sm font-medium text-console-text">
          Migration pull request opened
        </h2>
        <p className="truncate text-xs text-console-muted">
          <span className="font-mono text-console-success">{mission.pr.branch}</span>
          {" · "}
          {verificationClean(mission.verification)
            ? "verified and approved by a human"
            : "approved by a human"}
        </p>
      </div>
      <a
        href={mission.pr.pr_url}
        target="_blank"
        rel="noreferrer"
        className="console-button console-button-primary"
      >
        View pull request
        <ConsoleIcon name="external" size={13} />
      </a>
    </section>
  );
}
