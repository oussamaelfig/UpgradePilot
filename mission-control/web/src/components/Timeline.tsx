import type { Mission, Stage } from "../types";
import { STAGE_LABELS, STAGE_ORDER } from "../types";

type StageState = "pending" | "active" | "done" | "failed";

function stageStates(mission: Mission): Record<Stage, StageState> {
  const states = Object.fromEntries(STAGE_ORDER.map((s) => [s, "pending"])) as Record<Stage, StageState>;
  for (const record of mission.stages) {
    states[record.stage] = record.status === "active" ? "active" : record.status;
  }
  return states;
}

function latestSummary(mission: Mission, stage: Stage): string | undefined {
  for (let i = mission.stages.length - 1; i >= 0; i--) {
    const record = mission.stages[i];
    if (record.stage === stage && record.summary) return record.summary;
  }
  return undefined;
}

function Dot({ state }: { state: StageState }) {
  if (state === "done") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ok/20">
        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-ok-deep stroke-2">
          <path d="M2 6.5 4.8 9 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (state === "failed") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-bad/15">
        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-bad-deep stroke-2">
          <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="stage-active-dot flex h-5 w-5 items-center justify-center rounded-full bg-accent/15">
        <div className="h-2 w-2 rounded-full bg-accent" />
      </div>
    );
  }
  return <div className="h-5 w-5 rounded-full border border-line bg-white" />;
}

export function Timeline({ mission }: { mission: Mission }) {
  const states = stageStates(mission);
  return (
    <nav className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-tertiary">
        Execution timeline
      </h2>
      <ol>
        {STAGE_ORDER.map((stage, index) => {
          const state = states[stage];
          const summary = latestSummary(mission, stage);
          return (
            <li key={stage} className="relative flex gap-3 pb-4 last:pb-0">
              {index < STAGE_ORDER.length - 1 && (
                <span
                  className={`absolute left-[9.5px] top-5 h-full w-px ${
                    state === "done" ? "bg-ok/50" : "bg-line"
                  }`}
                />
              )}
              <div className="relative z-10 mt-0.5 shrink-0">
                <Dot state={state} />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-base font-medium leading-5 ${
                    state === "active"
                      ? "text-accent"
                      : state === "done"
                        ? "text-ink"
                        : state === "failed"
                          ? "text-bad-deep"
                          : "text-ink-tertiary"
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </p>
                {summary && state !== "pending" && (
                  <p className="mt-0.5 truncate text-xs leading-4 text-ink-secondary" title={summary}>
                    {summary}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
