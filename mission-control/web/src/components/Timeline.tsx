import type { Mission, Stage } from "../types";
import { STAGE_LABELS, STAGE_ORDER } from "../types";
import { ConsoleIcon } from "./ConsoleIcons";

type StageState = "pending" | "active" | "done" | "failed";

function stageStates(mission: Mission): Record<Stage, StageState> {
  const states = Object.fromEntries(STAGE_ORDER.map((s) => [s, "pending"])) as Record<Stage, StageState>;
  for (const record of mission.stages) {
    states[record.stage] = record.status === "active" ? "active" : record.status;
  }
  // Event producers can advance to the next stage without emitting a second
  // record that closes the previous active stage. Once a later stage has
  // finished, an earlier stage cannot still be running in the UI.
  const furthestFinished = mission.stages.reduce((furthest, record) => {
    if (record.status === "active") return furthest;
    return Math.max(furthest, STAGE_ORDER.indexOf(record.stage));
  }, -1);
  STAGE_ORDER.forEach((stage, index) => {
    if (index < furthestFinished && states[stage] === "active") states[stage] = "done";
  });
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
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-console-success/25 bg-console-success-bg text-console-success">
        <ConsoleIcon name="check" size={12} />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-console-danger/25 bg-console-danger-bg text-console-danger">
        <ConsoleIcon name="x" size={11} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="stage-active-dot flex h-5 w-5 items-center justify-center rounded-full border border-console-info/30 bg-console-info-bg">
        <span className="h-1.5 w-1.5 rounded-full bg-console-info" />
      </span>
    );
  }
  return <span className="h-5 w-5 rounded-full border border-console-line bg-console-panel" />;
}

export function Timeline({ mission }: { mission: Mission }) {
  const states = stageStates(mission);
  const completed = Object.values(states).filter((state) => state === "done").length;

  return (
    <nav
      id="execution"
      aria-label="Execution timeline"
      className="panel-enter scroll-mt-24 overflow-hidden rounded-[10px] border border-console-line bg-console-panel"
    >
      <div className="flex h-10 items-center justify-between border-b border-console-line px-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-console-text">
          <ConsoleIcon name="timeline" size={15} className="text-console-muted" />
          Execution
        </h2>
        <span className="font-mono text-[10px] text-console-faint">
          {completed}/{STAGE_ORDER.length}
        </span>
      </div>
      <ol className="p-1.5">
        {STAGE_ORDER.map((stage, index) => {
          const state = states[stage];
          const summary = latestSummary(mission, stage);
          return (
            <li
              key={stage}
              className={`relative flex min-h-10 gap-2.5 rounded-md px-2 py-1.5 ${
                state === "active" ? "bg-console-subtle" : ""
              }`}
            >
              {index < STAGE_ORDER.length - 1 && (
                <span
                  className={`absolute left-[17.5px] top-7 h-[calc(100%-20px)] w-px ${
                    state === "done" ? "bg-console-success/35" : "bg-console-line"
                  }`}
                  aria-hidden="true"
                />
              )}
              <div className="relative z-10 mt-0.5 shrink-0" aria-hidden="true">
                <Dot state={state} />
              </div>
              <div className="min-w-0">
                <p
                  className={`truncate text-xs font-medium leading-4 ${
                    state === "active"
                      ? "text-console-text"
                      : state === "done"
                        ? "text-console-muted"
                        : state === "failed"
                          ? "text-console-danger"
                          : "text-console-faint"
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </p>
                {summary && state !== "pending" && (
                  <p className="truncate text-[10px] leading-4 text-console-faint" title={summary}>
                    {summary}
                  </p>
                )}
                <span className="sr-only"> — {state}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
