// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ApprovalModal } from "../src/components/ApprovalModal";
import type { Approval, Mission } from "../src/types";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const mission: Mission = {
  id: "m1",
  title: "openai 0.28.1 → 2.x",
  repo: "oussamaelfig/briefbot",
  package: "openai",
  from_version: "0.28.1",
  to_version: "2.x",
  created_at: "2026-08-29T00:00:00Z",
  stages: [],
  approvals: [],
  activity: [],
};

const approval: Approval = {
  id: "a1",
  status: "pending",
  action: {
    kind: "open_github_pr",
    repo: "oussamaelfig/briefbot",
    branch: "upgradepilot/openai-2x",
    base: "main",
    title: "Upgrade openai to 2.x",
  },
  evidence_summary: "13/13 tests pass after migration.",
  requested_at: "2026-08-29T00:00:00Z",
};

let container: HTMLDivElement;
let root: Root;

function renderModal(onDecide: Parameters<typeof ApprovalModal>[0]["onDecide"]) {
  act(() => {
    root = createRoot(container);
    root.render(<ApprovalModal mission={mission} approval={approval} onDecide={onDecide} />);
  });
}

const decideOk = async () => ({ ok: true }) as const;

function pressTab(shiftKey = false) {
  let event!: KeyboardEvent;
  act(() => {
    event = new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
  });
  return event;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
});

describe("ApprovalModal focus management", () => {
  it("exposes dialog semantics and takes focus on mount", () => {
    renderModal(decideOk);
    const dialog = container.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const labelId = dialog.getAttribute("aria-labelledby")!;
    expect(document.getElementById(labelId)?.textContent).toBe("Human approval required");
    expect(document.activeElement).toBe(dialog);
  });

  it("Tab wraps from the last control to the first, Shift+Tab from panel to the last", () => {
    renderModal(decideOk);
    const buttons = Array.from(container.querySelectorAll("button"));
    const [approve, reject] = buttons;
    act(() => reject.focus());
    pressTab();
    expect(document.activeElement).toBe(approve);
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;
    act(() => dialog.focus());
    pressTab(true);
    expect(document.activeElement).toBe(reject);
  });

  it("keeps focus inside the dialog while a decision is pending (all buttons disabled)", async () => {
    let resolveDecision!: (v: { ok: true }) => void;
    renderModal(() => new Promise((r) => (resolveDecision = r)));
    const approve = container.querySelector("button")!;
    await act(async () => {
      approve.click();
    });
    expect(approve.disabled).toBe(true);
    const event = pressTab();
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(container.querySelector('[role="dialog"]'));
    await act(async () => resolveDecision({ ok: true }));
  });

  it("restores focus to the previously focused element on unmount", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    renderModal(decideOk);
    expect(document.activeElement).not.toBe(trigger);
    act(() => root.unmount());
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
