import type { Mission, MissionStatus } from "../types";
import { Link } from "../router";
import { Wordmark } from "./Logo";

// Presentation-only mapping; the status itself is a server-side domain decision.
const STATUS_STYLES: Record<MissionStatus["kind"], string> = {
  success: "bg-ok/15 text-ok-deep",
  waiting: "bg-warn/15 text-warn-deep",
  danger: "bg-bad/10 text-bad-deep",
  active: "bg-accent/10 text-accent",
};

export function Header({
  mission,
  status,
  connection,
}: {
  mission: Mission;
  status: MissionStatus;
  connection: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2.5">
          <Link to="/" title="Back to the UpgradePilot site">
            <Wordmark size={24} />
          </Link>
          <span className="rounded-sm bg-ink/5 px-1.5 py-0.5 text-xxs font-semibold uppercase tracking-wider text-ink-secondary">
            Mission Control
          </span>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <div className="flex items-center gap-3">
          <a
            className="font-mono text-base text-ink-secondary transition-colors hover:text-accent"
            href={`https://github.com/${mission.repo}`}
            target="_blank"
            rel="noreferrer"
          >
            {mission.repo}
          </a>
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-sm text-ink">
            {mission.package}
            {"  "}
            <span className="text-bad-deep">{mission.from_version ?? "?"}</span>
            <span className="mx-1 text-ink-tertiary">→</span>
            <span className="text-ok-deep">{mission.to_version ?? "?"}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wider ${STATUS_STYLES[status.kind]}`}
          >
            {status.label}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                connection === "live" ? "bg-ok" : "bg-warn"
              }`}
            />
            {connection === "live" ? "live" : "reconnecting"}
          </span>
        </div>
      </div>
    </header>
  );
}
