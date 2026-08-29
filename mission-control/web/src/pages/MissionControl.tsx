import { ApprovalModal } from "../components/ApprovalModal";
import { Header } from "../components/Header";
import { LogoMark } from "../components/Logo";
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-line bg-white shadow-sm">
        <LogoMark size={34} color="#2f80ed" />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">UpgradePilot Mission Control</h1>
        <p className="mt-1 text-base text-ink-secondary">From breaking change to verified PR.</p>
      </div>
      <div className="max-w-md rounded-lg border border-line bg-white p-4 text-left shadow-sm">
        <p className="text-sm leading-5 text-ink-secondary">
          Waiting for a mission. Start the <span className="font-mono text-ink">UpgradePilot</span> agent in
          TrueForge and ask it to upgrade a repository — the timeline lights up here the moment it calls{" "}
          <span className="font-mono text-accent">start_mission</span>.
        </p>
      </div>
      <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${connection === "live" ? "bg-ok" : "bg-warn"}`}
        />
        {connection === "live" ? "connected to mission control" : "connecting…"}
      </span>
      <Link to="/" className="text-xs text-ink-tertiary underline-offset-2 hover:text-ink-secondary hover:underline">
        ← Back to upgradepilot.dev
      </Link>
    </div>
  );
}

export function MissionControl() {
  const { mission, status, connection, decide } = useMission();

  if (!mission || !status) return <EmptyState connection={connection} />;

  const pendingApproval = mission.approvals.find((a) => a.status === "pending");

  return (
    <div className="min-h-screen bg-surface">
      <Header mission={mission} status={status} connection={connection} />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-5 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
          <div className="space-y-4">
            <Timeline mission={mission} />
            <ActivityFeed mission={mission} />
          </div>
          <div className="min-w-0 space-y-4">
            <PrCard mission={mission} />
            <BeforeAfterPanel mission={mission} />
            <BreakingChangesPanel mission={mission} />
            <AffectedFilesPanel mission={mission} />
            <MigrationPlanPanel mission={mission} />
          </div>
        </div>
      </main>
      {pendingApproval && <ApprovalModal mission={mission} approval={pendingApproval} onDecide={decide} />}
    </div>
  );
}
