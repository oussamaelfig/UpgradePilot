// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Link, navigate, useRoute } from "../src/router";

// React's act() needs this to accept updates outside a test renderer.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function RouteProbe() {
  const route = useRoute();
  return <span data-testid="route">{route}</span>;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  window.scrollTo = () => {}; // jsdom does not implement scrolling
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
});

function render(ui: React.ReactElement) {
  act(() => {
    root = createRoot(container);
    root.render(ui);
  });
}

describe("history-API router", () => {
  it("navigate() pushes a history entry and updates the rendered route", () => {
    render(<RouteProbe />);
    expect(container.textContent).toBe("/");
    act(() => navigate("/mission"));
    expect(window.location.pathname).toBe("/mission");
    expect(container.textContent).toBe("/mission");
  });

  it("the back button (popstate) restores the previous route", () => {
    render(<RouteProbe />);
    act(() => navigate("/mission"));
    expect(container.textContent).toBe("/mission");
    // jsdom's history.back() is async in its event dispatch; simulate the
    // traversal it performs: the URL change plus the popstate event.
    act(() => {
      window.history.replaceState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(container.textContent).toBe("/");
  });

  it("a plain Link click is intercepted: no default navigation, route changes in place", () => {
    render(<Link to="/mission">go</Link>);
    const anchor = container.querySelector("a")!;
    expect(anchor.getAttribute("href")).toBe("/mission");
    let event!: MouseEvent;
    act(() => {
      event = new MouseEvent("click", { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(window.location.pathname).toBe("/mission");
  });

  it("modifier-key clicks are left to the browser (open-in-new-tab must keep working)", () => {
    render(<Link to="/mission">go</Link>);
    const anchor = container.querySelector("a")!;
    for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
      let event!: MouseEvent;
      act(() => {
        event = new MouseEvent("click", { bubbles: true, cancelable: true, [modifier]: true });
        anchor.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(false);
    }
    expect(window.location.pathname).toBe("/");
  });

  it("deep link: a component mounting on a non-root path renders that path", () => {
    window.history.replaceState({}, "", "/mission");
    render(<RouteProbe />);
    expect(container.textContent).toBe("/mission");
  });
});

describe("App route matching", () => {
  it("unknown paths render the not-found page, never the live dashboard", async () => {
    const { default: App } = await import("../src/App");
    window.history.replaceState({}, "", "/misson"); // typo on purpose
    render(<App />);
    expect(container.textContent).toContain("Page not found");
    expect(container.textContent).toContain("/misson");
    expect(document.title).toBe("Page not found — UpgradePilot");
  });

  it("the landing route sets the marketing document title", async () => {
    const { default: App } = await import("../src/App");
    window.history.replaceState({}, "", "/");
    render(<App />);
    expect(document.title).toBe("UpgradePilot — From breaking change to verified PR");
  });
});
