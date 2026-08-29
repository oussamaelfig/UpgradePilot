import type { Mission, MissionStatus } from "../types";
import { Link } from "../router";
import { ConsoleIcon, type ConsoleIconName } from "./ConsoleIcons";
import { Wordmark } from "./Logo";

const STATUS_STYLES: Record<MissionStatus["kind"], string> = {
  success: "border-console-success/25 bg-console-success-bg text-console-success",
  waiting: "border-console-warning/25 bg-console-warning-bg text-console-warning",
  danger: "border-console-danger/25 bg-console-danger-bg text-console-danger",
  active: "border-console-info/25 bg-console-info-bg text-console-info",
};

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: ConsoleIconName }[];
}[] = [
  {
    label: "Mission",
    items: [
      { href: "#overview", label: "Overview", icon: "overview" },
      { href: "#execution", label: "Execution", icon: "timeline" },
      { href: "#activity", label: "Agent activity", icon: "activity" },
    ],
  },
  {
    label: "Review",
    items: [
      { href: "#evidence", label: "Test evidence", icon: "evidence" },
      { href: "#breaking-changes", label: "Breaking changes", icon: "changes" },
      { href: "#affected-files", label: "Affected files", icon: "impact" },
      { href: "#migration-plan", label: "Migration changes", icon: "file" },
    ],
  },
];

const MOBILE_NAV = NAV_GROUPS.flatMap((group) => group.items);

export function StatusPill({ status }: { status: MissionStatus }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-md border px-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] ${STATUS_STYLES[status.kind]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status.label}
    </span>
  );
}

export function LiveIndicator({ connection, verbose = false }: { connection: string; verbose?: boolean }) {
  const live = connection === "live";
  // First connection attempt is not a dropped stream: "reconnecting" is
  // reserved for a stream that was live and went away.
  const connecting = connection === "connecting";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-console-muted">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {live && <span className="absolute inset-0 rounded-full bg-console-success/40 motion-safe:animate-ping" />}
        <span
          className={`relative h-2 w-2 rounded-full ${
            live ? "bg-console-success" : connecting ? "bg-console-muted" : "bg-console-warning"
          }`}
        />
      </span>
      {live
        ? verbose
          ? "Mission stream connected"
          : "Live"
        : connecting
          ? verbose
            ? "Connecting to stream"
            : "Connecting"
          : verbose
            ? "Reconnecting to stream"
            : "Reconnecting"}
    </span>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: ConsoleIconName;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70 ${
        active
          ? "bg-console-sidebar-active text-console-text"
          : "text-console-sidebar-text hover:bg-console-sidebar-active hover:text-console-text"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <ConsoleIcon name={icon} size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}

function MissionSidebar({
  mission,
  status,
  connection,
}: {
  mission: Mission;
  status: MissionStatus;
  connection: string;
}) {
  const [owner, repository = owner] = mission.repo.split("/");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-console-sidebar-line bg-console-sidebar lg:flex">
      <div className="flex h-12 shrink-0 items-center border-b border-console-sidebar-line px-3.5">
        <Link
          to="/"
          title="Back to the UpgradePilot site"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70"
        >
          <Wordmark color="#f8f8f8" size={22} />
        </Link>
      </div>

      <div className="p-2">
        <a
          className="flex min-w-0 items-center gap-2 rounded-md border border-console-sidebar-line bg-console-sidebar-control px-2 py-2 text-left transition-colors hover:bg-console-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70"
          href={`https://github.com/${mission.repo}`}
          target="_blank"
          rel="noreferrer"
          title={`Open ${mission.repo} on GitHub`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-console-subtle text-console-text">
            <ConsoleIcon name="repository" size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10px] leading-3 text-console-faint">{owner}</span>
            <span className="block truncate text-sm leading-4 text-console-text">{repository}</span>
          </span>
          <ConsoleIcon name="external" size={13} className="text-console-faint" />
        </a>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label="Mission sections">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="border-b border-console-sidebar-line py-3 last:border-b-0">
            <p className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-console-faint">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink {...item} active={item.href === "#overview"} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-console-sidebar-line p-3">
        <div className="mb-3 space-y-2 rounded-lg border border-console-sidebar-line bg-console-sidebar-control p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-console-faint">Run</span>
            <StatusPill status={status} />
          </div>
          <LiveIndicator connection={connection} verbose />
        </div>
        <Link
          to="/"
          className="flex h-8 items-center gap-2 rounded-md px-2 text-sm text-console-sidebar-text transition-colors hover:bg-console-sidebar-active hover:text-console-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70"
        >
          <ConsoleIcon name="chevron" size={15} className="rotate-180" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}

function Topbar({
  mission,
  connection,
}: {
  mission: Mission;
  connection: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-console-line bg-console-bg/95 backdrop-blur">
      <div className="flex h-12 items-center gap-3 px-4 sm:px-5">
        <Link
          to="/"
          title="Back to the UpgradePilot site"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70 lg:hidden"
        >
          <Wordmark color="#f8f8f8" size={20} />
        </Link>
        <div className="hidden min-w-0 items-center gap-2 text-xs lg:flex">
          <span className="text-console-faint">Mission Control</span>
          <span className="text-console-border" aria-hidden="true">
            /
          </span>
          <span className="truncate font-mono text-console-muted">{mission.id}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <a
            href={`https://github.com/${mission.repo}`}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs text-console-muted transition-colors hover:bg-console-subtle hover:text-console-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70 sm:inline-flex"
          >
            <ConsoleIcon name="repository" size={14} />
            <span className="max-w-48 truncate">{mission.repo}</span>
            <ConsoleIcon name="external" size={12} />
          </a>
          <span className="hidden h-4 w-px bg-console-line sm:block" aria-hidden="true" />
          <LiveIndicator connection={connection} />
        </div>
      </div>

      <nav
        aria-label="Mission sections"
        className="scrollbar-none flex h-10 items-center gap-1 overflow-x-auto border-t border-console-line px-3 lg:hidden"
      >
        {MOBILE_NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-console-muted hover:bg-console-subtle hover:text-console-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70"
          >
            <ConsoleIcon name={item.icon} size={13} />
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function ConsoleShell({
  mission,
  status,
  connection,
  children,
}: {
  mission: Mission;
  status: MissionStatus;
  connection: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mission-console min-h-screen bg-console-bg text-console-text">
      <a
        href="#mission-content"
        className="fixed left-3 top-3 z-[70] -translate-y-20 rounded-md bg-console-text px-3 py-2 text-sm font-medium text-console-bg transition-transform focus:translate-y-0"
      >
        Skip to mission content
      </a>
      <MissionSidebar mission={mission} status={status} connection={connection} />
      <div className="min-w-0 lg:pl-60">
        <Topbar mission={mission} connection={connection} />
        {children}
      </div>
    </div>
  );
}
