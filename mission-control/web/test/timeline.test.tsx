// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { Timeline } from "../src/components/Timeline";
import type { Mission } from "../src/types";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe("Timeline progression", () => {
  it("closes a stale active stage after a later stage finishes", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const mission: Mission = {
      id: "mission-1",
      title: "Upgrade SDK",
      repo: "owner/repository",
      package: "sdk",
      created_at: "2026-08-29T00:00:00Z",
      approvals: [],
      activity: [],
      stages: [
        {
          stage: "awaiting_approval",
          status: "active",
          summary: "Waiting for operator",
          ts: "2026-08-29T00:01:00Z",
        },
        {
          stage: "opening_pr",
          status: "done",
          summary: "Pull request opened",
          ts: "2026-08-29T00:02:00Z",
        },
      ],
    };

    act(() => root.render(<Timeline mission={mission} />));
    const approvalRow = Array.from(container.querySelectorAll("li")).find((row) =>
      row.textContent?.includes("Awaiting approval"),
    );

    expect(approvalRow?.textContent).toContain("done");
    expect(approvalRow?.className).not.toContain("bg-console-subtle");

    act(() => root.unmount());
    container.remove();
  });
});
