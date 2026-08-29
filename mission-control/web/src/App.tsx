import { ApprovalModal } from "./components/ApprovalModal";
import { Header } from "./components/Header";
import {
  ActivityFeed,
  AffectedFilesPanel,
  BeforeAfterPanel,
  BreakingChangesPanel,
  MigrationPlanPanel,
  PrCard,
} from "./components/Panels";
import { Timeline } from "./components/Timeline";
import { useMission } from "./useMission";

function EmptyState({ connection }: { connection: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/25 to-emerald-500/25 ring-1 ring-zinc-700">
        <span className="text-3xl">🛫</span>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">UpgradePilot Mission Control</h1>
        <p className="mt-1 text-[13px] text-zinc-500">From breaking change to verified PR.</p>
      </div>
      <div className="max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left">
        <p className="text-[12px] leading-5 text-zinc-400">
          Waiting for a mission. Start the <span className="font-mono text-zinc-300">UpgradePilot</span> agent in
          TrueForge and ask it to upgrade a repository — the timeline lights up here the moment it calls{" "}
          <span className="font-mono text-sky-300">start_mission</span>.
        </p>
      </div>
      <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${connection === "live" ? "bg-emerald-400" : "bg-amber-400"}`}
        />
        {connection === "live" ? "connected to mission control" : "connecting…"}
      </span>
    </div>
  );
}

export default function App() {
  const { mission, connection, decide } = useMission();

  if (!mission) return <EmptyState connection={connection} />;

  const pendingApproval = mission.approvals.find((a) => a.status === "pending");

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-5 lg:px-6">
      <Header mission={mission} connection={connection} />
      <main className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
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
      </main>
      {pendingApproval && <ApprovalModal mission={mission} approval={pendingApproval} onDecide={decide} />}
    </div>
  );
}
