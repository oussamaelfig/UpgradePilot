import type { Mission } from "../types";

function statusOf(mission: Mission): { label: string; className: string } {
  if (mission.pr) return { label: "PR OPENED", className: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40" };
  const pending = mission.approvals.some((a) => a.status === "pending");
  if (pending) return { label: "AWAITING APPROVAL", className: "bg-amber-500/15 text-amber-300 ring-amber-400/40" };
  const rejected = mission.approvals.some((a) => a.status === "rejected");
  if (rejected) return { label: "REJECTED", className: "bg-red-500/15 text-red-300 ring-red-400/40" };
  const failed = mission.stages.some((s) => s.status === "failed");
  if (failed) return { label: "ATTENTION", className: "bg-red-500/15 text-red-300 ring-red-400/40" };
  return { label: "RUNNING", className: "bg-sky-500/15 text-sky-300 ring-sky-400/40" };
}

export function Header({ mission, connection }: { mission: Mission; connection: string }) {
  const status = statusOf(mission);
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/30 to-emerald-500/30 ring-1 ring-zinc-700">
          <span className="text-lg">🛫</span>
        </div>
        <div>
          <h1 className="text-[15px] font-semibold leading-5 text-zinc-100">UpgradePilot</h1>
          <p className="text-[11px] leading-4 text-zinc-500">Mission Control</p>
        </div>
      </div>

      <div className="mx-2 hidden h-8 w-px bg-zinc-800 sm:block" />

      <div className="flex items-center gap-3">
        <a
          className="font-mono text-[13px] text-zinc-300 hover:text-sky-300"
          href={`https://github.com/${mission.repo}`}
          target="_blank"
          rel="noreferrer"
        >
          {mission.repo}
        </a>
        <span className="rounded-md bg-zinc-800/80 px-2 py-1 font-mono text-[12px] text-zinc-300 ring-1 ring-zinc-700">
          {mission.package}
          {"  "}
          <span className="text-red-300">{mission.from_version ?? "?"}</span>
          <span className="mx-1 text-zinc-500">→</span>
          <span className="text-emerald-300">{mission.to_version ?? "?"}</span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider ring-1 ${status.className}`}>
          {status.label}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              connection === "live" ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {connection === "live" ? "live" : "reconnecting"}
        </span>
      </div>
    </header>
  );
}
