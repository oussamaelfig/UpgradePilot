// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApprovalModal } from "../src/components/ApprovalModal";
import type { Approval, Mission } from "../src/types";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const approval: Approval = {
  id: "approval-1",
  status: "pending",
  action: {
    kind: "open_github_pr",
    repo: "owner/repository",
    branch: "upgrade/sdk",
    base: "main",
    title: "Upgrade the SDK",
  },
  evidence_summary: "Tests pass and no legacy calls remain.",
  requested_at: "2026-08-29T20:00:00.000Z",
};

const mission: Mission = {
  id: "mission-1",
  title: "Upgrade SDK",
  repo: "owner/repository",
  package: "sdk",
  from_version: "1.0.0",
  to_version: "2.0.0",
  created_at: "2026-08-29T19:00:00.000Z",
  stages: [],
  approvals: [approval],
  activity: [],
  baseline: {
    command: "npm test",
    exit_code: 1,
    passed: 1,
    failed: 1,
    errors: 0,
    total: 2,
    log_excerpt: "1 failed",
    installed_version: "2.0.0",
  },
  verification: {
    command: "npm test",
    exit_code: 0,
    passed: 2,
    failed: 0,
    errors: 0,
    total: 2,
    log_excerpt: "2 passed",
    installed_version: "2.0.0",
    legacy_patterns_remaining: 0,
  },
};

let container: HTMLDivElement;
let root: Root | undefined;
let returnTarget: HTMLButtonElement;

beforeEach(() => {
  returnTarget = document.createElement("button");
  returnTarget.textContent = "Open approval";
  document.body.appendChild(returnTarget);
  returnTarget.focus();

  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  returnTarget.remove();
});

function renderModal(onDecide = vi.fn(async () => ({ ok: true as const }))) {
  act(() => {
    root = createRoot(container);
    root.render(
      <ApprovalModal mission={mission} approval={approval} onDecide={onDecide} />,
    );
  });
  return onDecide;
}

describe("ApprovalModal safety", () => {
  it("exposes a labelled modal dialog and initially focuses its neutral panel", () => {
    renderModal();
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;

    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("approval-modal-title");
    expect(dialog.getAttribute("aria-describedby")).toContain("approval-modal-safety");
    expect(document.activeElement).toBe(dialog);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does not dismiss or decide when Escape is pressed", () => {
    const onDecide = renderModal();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain("Approval remains open");
    expect(onDecide).not.toHaveBeenCalled();
  });

  it("traps keyboard focus and submits only an explicit button decision", async () => {
    const onDecide = renderModal();
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button"));
    const reject = buttons.find((button) => button.textContent?.includes("Reject"))!;
    const approve = buttons.find((button) => button.textContent?.includes("Approve"))!;

    approve.focus();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    });
    expect(document.activeElement).toBe(reject);

    await act(async () => {
      approve.click();
      await Promise.resolve();
    });
    expect(onDecide).toHaveBeenCalledWith("approval-1", "approved");
  });

  it("restores focus to the invoking control when the dialog unmounts", () => {
    renderModal();
    act(() => root?.unmount());
    root = undefined;
    expect(document.activeElement).toBe(returnTarget);
  });
});
