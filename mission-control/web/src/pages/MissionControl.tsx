import { ApprovalModal } from "../components/ApprovalModal";
import { ConsoleIcon } from "../components/ConsoleIcons";
import { ConsoleShell, LiveIndicator } from "../components/ConsoleShell";
import { Header } from "../components/Header";
import { Wordmark } from "../components/Logo";
import {
  ActivityFeed,
  AffectedFilesPanel,
  BeforeAfterPanel,
  BreakingChangesPanel,
  MigrationPlanPanel,
  PrCard,
} from "../components/Panels";
import { Timeline } from "../components/Timeline";
import { Link } from "../router";
import { useMission } from "../useMission";

function EmptyState({ connection }: { connection: string }) {
  return (
    <div className="mission-console min-h-screen bg-console-bg text-console-text">
      <header className="flex h-12 items-center border-b border-console-line px-4 sm:px-5">
        <Link
          to="/"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-console-text/70"
        >
          <Wordmark color="#f8f8f8" size={21} />
        </Link>
        <span className="ml-3 hidden h-4 w-px bg-console-line sm:block" aria-hidden="true" />
        <span className="ml-3 hidden text-xs text-console-faint sm:block">Mission Control</span>
        <span className="ml-auto">
          <LiveIndicator connection={connection} verbose />
        </span>
      </header>
      <main
        id="mission-content"
        className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-5 py-12"
      >
        <section
          aria-labelledby="empty-mission-title"
          className="w-full max-w-lg overflow-hidden rounded-[10px] border border-console-line bg-console-panel"
        >
          <div className="flex items-center gap-3 border-b border-console-line px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-console-subtle text-console-muted">
              <ConsoleIcon name="activity" size={16} />
            </span>
            <div>
              <h1 id="empty-mission-title" className="text-sm font-medium text-console-text">
                Waiting for a migration run
              </h1>
              <p className="text-xs text-console-faint">No active mission is available yet.</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm leading-6 text-console-muted">
              Start the UpgradePilot agent in TrueForge and ask it to upgrade a repository. This console will
              connect automatically when the agent starts the mission.
            </p>
            <div className="mt-4 rounded-md border border-console-line bg-console-code px-3 py-2 font-mono text-xs text-console-muted">
              start_mission → live execution stream
            </div>
            <Link
              to="/"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-console-muted hover:text-console-text hover:underline hover:underline-offset-4"
            >
              <ConsoleIcon name="chevron" size={13} className="rotate-180" />
              Back to the UpgradePilot site
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export function MissionControl() {
  const { mission, status, connection, decide } = useMission();

  if (!mission || !status) return <EmptyState connection={connection} />;

  const pendingApproval = mission.approvals.find((a) => a.status === "pending");

  return (
    <ConsoleShell mission={mission} status={status} connection={connection}>
      <Header mission={mission} status={status} connection={connection} />
      <main id="mission-content" className="px-4 pb-8 sm:px-5">
        <div className="space-y-3">
          <PrCard mission={mission} />
          <div className="grid items-start gap-3 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <Timeline mission={mission} />
            </div>
            <div className="min-w-0 space-y-3">
              <BeforeAfterPanel mission={mission} />
              <BreakingChangesPanel mission={mission} />
            </div>
            <aside
              aria-label="Mission details"
              className="min-w-0 space-y-3 lg:col-start-2 xl:col-start-auto"
            >
              <ActivityFeed mission={mission} connection={connection} />
              <AffectedFilesPanel mission={mission} />
              <MigrationPlanPanel mission={mission} />
            </aside>
          </div>
        </div>
      </main>
      {pendingApproval && (
        <ApprovalModal mission={mission} approval={pendingApproval} onDecide={decide} />
      )}
    </ConsoleShell>
  );
}
