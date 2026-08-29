import type { Mission, MissionStatus } from "../types";
import { ConsoleIcon } from "./ConsoleIcons";
import { LiveIndicator, StatusPill } from "./ConsoleShell";

export function Header({
  mission,
  status,
  connection,
}: {
  mission: Mission;
  status: MissionStatus;
  connection: string;
}) {
  const createdAt = new Date(mission.created_at);
  const createdLabel = Number.isNaN(createdAt.getTime())
    ? "Run in progress"
    : createdAt.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <section id="overview" aria-labelledby="mission-title" className="px-4 pb-3 pt-4 sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-console-faint">
            <ConsoleIcon name="activity" size={13} />
            Active migration run
            <span className="text-console-border" aria-hidden="true">
              /
            </span>
            <span className="normal-case tracking-normal text-console-muted">{createdLabel}</span>
          </div>
          <h1 id="mission-title" className="truncate text-2xl font-semibold tracking-tight text-console-text">
            {mission.title}
          </h1>
          <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-console-muted">
            <a
              className="inline-flex min-w-0 items-center gap-1.5 hover:text-console-text hover:underline hover:underline-offset-4"
              href={`https://github.com/${mission.repo}`}
              target="_blank"
              rel="noreferrer"
            >
              <ConsoleIcon name="repository" size={14} />
              <span className="truncate font-mono">{mission.repo}</span>
              <ConsoleIcon name="external" size={12} />
            </a>
            <span className="text-console-border" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ConsoleIcon name="package" size={14} />
              {mission.package}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill status={status} />
          <span className="xl:hidden">
            <LiveIndicator connection={connection} verbose />
          </span>
        </div>
      </div>

      <dl className="mt-3 grid overflow-hidden rounded-[10px] border border-console-line bg-console-panel sm:grid-cols-2 xl:grid-cols-4">
        <ContextItem
          icon="repository"
          label="Repository"
          value={mission.repo}
          mono
        />
        <ContextItem icon="package" label="Dependency" value={mission.package} />
        <ContextItem
          icon="changes"
          label="Version change"
          value={`${mission.from_version ?? "unknown"} → ${mission.to_version ?? "unknown"}`}
          mono
        />
        <ContextItem
          icon="clock"
          label="Mission ID"
          value={mission.id}
          mono
        />
      </dl>
    </section>
  );
}

function ContextItem({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: "repository" | "package" | "changes" | "clock";
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-console-line px-3 py-2.5 last:border-b-0 sm:[&:nth-child(3)]:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-console-subtle text-console-muted">
        <ConsoleIcon name={icon} size={15} />
      </span>
      <div className="min-w-0">
        <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-console-faint">{label}</dt>
        <dd className={`mt-0.5 truncate text-sm text-console-text ${mono ? "font-mono" : ""}`} title={value}>
          {value}
        </dd>
      </div>
    </div>
  );
}
