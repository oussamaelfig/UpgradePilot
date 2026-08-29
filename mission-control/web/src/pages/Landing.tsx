import { useEffect, useState } from "react";
import { LogoMark, Wordmark } from "../components/Logo";
import { Link } from "../router";

const GITHUB_URL = "https://github.com/oussamaelfig/UpgradePilot";

/* ---------- small hand-made icons (20x20, stroke currentColor) ---------- */

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-[inherit] shrink-0"
      aria-hidden
    >
      <path
        d={d}
        stroke="currentColor"
        fill="none"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  doc: "M6 3h6l3 3v11H6V3Zm6 0v3h3M8.5 9.5h5m-5 3h5",
  scan: "M12.5 12.5 16 16m-9.5-3a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm-1.8-4.5h3.6",
  flask: "M8 3h4m-3 0v4.5L4.8 14a2 2 0 0 0 1.7 3h7a2 2 0 0 0 1.7-3L11 7.5V3M6.6 12h6.8",
  wrench: "M13.5 3.5a3.5 3.5 0 0 0-3.3 4.6L4 14.3a1.7 1.7 0 1 0 2.4 2.4l6.2-6.2a3.5 3.5 0 0 0 4.5-4.2l-2.3 2.3-2.2-.7-.7-2.2 2.3-2.3a3.5 3.5 0 0 0-.7 0Z",
  shield: "M10 2.8 16 5v5c0 3.8-2.6 6.3-6 7.2C6.6 16.3 4 13.8 4 10V5l6-2.2Zm-2.5 7 1.8 1.8 3.2-3.4",
  hand: "M7 10.5V4.8a1.2 1.2 0 0 1 2.4 0v4.4m0-3.4a1.2 1.2 0 0 1 2.4 0v3.4m0-2.2a1.2 1.2 0 0 1 2.4 0v6c0 2.8-2 4.5-4.6 4.5-2.2 0-3.4-1-4.5-2.9L3.6 11a1.3 1.3 0 0 1 2.2-1.3L7 11.4",
  pr: "M6 6.2a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Zm0 0v7.6m0 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm8 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm0 0V9a2.8 2.8 0 0 0-2.8-2.8H9.4m2.2-2.4L9.4 6.2l2.2 2.4",
  globe: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm-7-7h14M10 3c1.9 1.9 2.9 4.4 2.9 7s-1 5.1-2.9 7c-1.9-1.9-2.9-4.4-2.9-7s1-5.1 2.9-7Z",
  box: "M3.5 6.5 10 3l6.5 3.5v7L10 17l-6.5-3.5v-7Zm0 0L10 10m0 0 6.5-3.5M10 10v7",
  check: "M4 10.5 8.2 15 16 5.5",
};

/* ---------- sticky nav with scroll shadow, like the reference ---------- */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky inset-x-0 top-0 z-50 bg-surface transition-all ${scrolled ? "shadow" : ""}`}
    >
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 md:py-5" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5">
            <Wordmark size={26} />
          </Link>
        </div>
        <div className="flex items-center space-x-4 text-sm sm:space-x-6 md:text-body">
          <a className="hidden text-ink-secondary hover:text-ink sm:block" href="#how-it-works">
            How it works
          </a>
          <a className="hidden text-ink-secondary hover:text-ink sm:block" href="#capabilities">
            Capabilities
          </a>
          <a className="hidden text-ink-secondary hover:text-ink sm:block" href="#evidence">
            Evidence
          </a>
          <a
            className="hidden text-ink-secondary hover:text-ink sm:block"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <Link to="/mission" className="btn btn-blue font-medium">
            <span className="sm:hidden">Mission Control</span>
            <span className="hidden sm:inline">Open Mission Control</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ---------- hand-built dashboard mock (no copied assets) ---------- */

function MockChip({ tone, children }: { tone: "red" | "green" | "blue" | "gray"; children: React.ReactNode }) {
  const tones = {
    red: "bg-bad/10 text-bad-deep",
    green: "bg-ok/15 text-ok-deep",
    blue: "bg-accent/10 text-accent",
    gray: "bg-ink/5 text-ink-secondary",
  };
  return <span className={`rounded-sm px-1 py-px font-mono text-[8px] leading-3 ${tones[tone]}`}>{children}</span>;
}

function DashboardMock() {
  const stages: [string, "done" | "active" | "pending"][] = [
    ["Reading release notes", "done"],
    ["Analyzing repository", "done"],
    ["Running baseline", "done"],
    ["Migrating code", "done"],
    ["Verifying upgrade", "done"],
    ["Awaiting approval", "active"],
    ["Opening PR", "pending"],
  ];
  const rows = [
    ["openai.ChatCompletion", "removed", "client.chat.completions.create"],
    ["openai.Embedding", "removed", "client.embeddings.create"],
    ["openai.api_base", "config", "OpenAI(base_url=…)"],
    ["response dict access", "behavior", "resp.choices[0]"],
  ];
  return (
    <div className="mx-auto w-full max-w-5xl rounded-lg border border-line bg-white shadow-xl">
      {/* browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-bad/70" />
        <span className="h-2 w-2 rounded-full bg-gold/80" />
        <span className="h-2 w-2 rounded-full bg-ok/80" />
        <span className="ml-3 flex items-center gap-1 rounded-sm bg-surface px-2 py-0.5 font-mono text-[9px] text-ink-tertiary">
          upgradepilot.local/mission
        </span>
        <span className="ml-auto flex items-center gap-1 text-[9px] text-ink-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" /> live
        </span>
      </div>
      {/* header strip */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <LogoMark size={14} />
        <span className="text-[10px] font-semibold text-ink">UpgradePilot</span>
        <span className="hidden font-mono text-[9px] text-ink-tertiary sm:inline">
          oussamaelfig/briefbot
        </span>
        <span className="hidden rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[8px] text-ink-secondary min-[480px]:inline">
          openai <span className="text-bad-deep">0.28.1</span> → <span className="text-ok-deep">2.x</span>
        </span>
        <span className="ml-auto rounded-full bg-warn/15 px-2 py-0.5 text-[8px] font-semibold tracking-wide text-warn-deep">
          AWAITING APPROVAL
        </span>
      </div>
      {/* body */}
      <div className="grid gap-3 p-4 md:grid-cols-[190px_1fr]">
        {/* timeline */}
        <div className="rounded-md border border-line p-3">
          <p className="mb-2 text-[8px] font-semibold uppercase tracking-widest text-ink-tertiary">
            Execution timeline
          </p>
          <ul className="space-y-1.5">
            {stages.map(([label, state]) => (
              <li key={label} className="flex items-center gap-1.5">
                {state === "done" ? (
                  <span className="flex h-3 w-3 items-center justify-center rounded-full bg-ok/20">
                    <svg viewBox="0 0 8 8" className="h-2 w-2 stroke-ok-deep" fill="none" strokeWidth="1.6">
                      <path d="M1.5 4.2 3.2 6 6.5 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : state === "active" ? (
                  <span className="flex h-3 w-3 items-center justify-center rounded-full bg-accent/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                ) : (
                  <span className="h-3 w-3 rounded-full border border-line" />
                )}
                <span
                  className={`text-[9px] leading-3.5 ${
                    state === "active" ? "font-medium text-accent" : state === "done" ? "text-ink-secondary" : "text-ink-tertiary"
                  }`}
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {/* panels */}
        <div className="min-w-0 space-y-3">
          <div className="rounded-md border border-line p-3">
            <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-widest text-ink-tertiary">
              Breaking changes (6)
            </p>
            <table className="w-full text-left">
              <tbody>
                {rows.map(([sym, type, after]) => (
                  <tr key={sym} className="border-t border-line/70">
                    <td className="py-1 pr-2 font-mono text-[8px] text-ink">{sym}</td>
                    <td className="py-1 pr-2">
                      <MockChip tone={type === "removed" ? "red" : type === "config" ? "blue" : "gray"}>{type}</MockChip>
                    </td>
                    <td className="py-1 font-mono text-[8px] text-ok-deep">{after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-bad/30 bg-bad/5 p-3">
              <p className="text-[8px] font-semibold uppercase tracking-widest text-ink-tertiary">Before migration</p>
              <p className="mt-1 font-mono text-md font-bold text-bad-deep">9 failing</p>
              <p className="font-mono text-[8px] text-ink-tertiary">APIRemovedInV1 at every call site</p>
            </div>
            <div className="rounded-md border border-ok/40 bg-ok/10 p-3">
              <p className="text-[8px] font-semibold uppercase tracking-widest text-ink-tertiary">After migration</p>
              <p className="mt-1 font-mono text-md font-bold text-ok-deep">13/13 pass</p>
              <p className="font-mono text-[8px] text-ink-tertiary">0 legacy call sites remaining</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- pipeline stepper ---------- */

const PIPELINE: { icon: keyof typeof ICONS; label: string; blurb: string }[] = [
  { icon: "doc", label: "Read the docs", blurb: "Official migration guide, scraped live" },
  { icon: "scan", label: "Locate usage", blurb: "Every affected file and call site" },
  { icon: "flask", label: "Reproduce", blurb: "Upgrade fails in a clean sandbox" },
  { icon: "wrench", label: "Migrate", blurb: "Code rewritten to the new API" },
  { icon: "shield", label: "Verify", blurb: "Same tests, now green" },
  { icon: "hand", label: "Approve", blurb: "A human signs off on the evidence" },
  { icon: "pr", label: "Open the PR", blurb: "Real branch, real pull request" },
];

function PipelineCard() {
  return (
    <div className="mx-auto w-full max-w-6xl rounded-lg bg-white p-6 shadow-xl md:p-10">
      <ol className="grid gap-6 md:grid-cols-7 md:gap-2">
        {PIPELINE.map((step, i) => (
          <li key={step.label} className="relative flex items-start gap-3 md:block">
            {i < PIPELINE.length - 1 && (
              <span className="absolute left-[13px] top-8 h-[calc(100%-8px)] w-px bg-line md:left-8 md:top-[13px] md:h-px md:w-[calc(100%-40px)]" />
            )}
            <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <span className="scale-75">
                <Icon d={ICONS[step.icon]} />
              </span>
            </span>
            <div className="md:mt-3">
              <div className="font-mono text-xs text-ink-tertiary">{String(i + 1).padStart(2, "0")}</div>
              <div className="text-body font-semibold text-ink">{step.label}</div>
              <p className="mt-0.5 text-sm leading-5 text-ink-secondary">{step.blurb}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- marquee ticker ---------- */

function MarqueeRow({ items, duration }: { items: string[]; duration: number }) {
  const doubled = [...items, ...items];
  return (
    <div className="flex flex-row overflow-hidden whitespace-nowrap py-1">
      <div className="marquee-track flex shrink-0 gap-2 pr-2" style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}>
        {doubled.map((item, i) => (
          <div key={i} className="rounded-md bg-white px-3 py-1 text-md text-ink-secondary shadow">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- gradient bento cards ---------- */

function BentoMiniTable() {
  return (
    <div className="mt-6 -mb-8 w-full rounded-t-lg bg-white p-4 shadow-lg">
      <p className="mb-2 font-mono text-[9px] text-ink-tertiary">breaking_changes.json · schema-validated</p>
      {[
        ["openai.ChatCompletion", "removed"],
        ["openai.error", "removed"],
        ["openai.api_base", "config_changed"],
      ].map(([sym, type]) => (
        <div key={sym} className="flex items-center justify-between border-t border-line py-1.5">
          <span className="font-mono text-[10px] text-ink">{sym}</span>
          <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[8px] ${type === "removed" ? "bg-bad/10 text-bad-deep" : "bg-accent/10 text-accent"}`}>
            {type}
          </span>
        </div>
      ))}
    </div>
  );
}

function BentoTerminal() {
  return (
    <div className="mt-6 -mb-8 w-full grow rounded-t-lg bg-ink p-4 font-mono text-[10px] leading-4 shadow-lg">
      <p className="text-white/40">$ daytona create --snapshot python-3.12</p>
      <p className="text-white/40">$ pip install openai==2.48.0</p>
      <p className="text-white/40">$ python -m pytest</p>
      <p className="mt-2 text-[#ff8c8c]">FAILED test_summarizer.py — APIRemovedInV1</p>
      <p className="text-[#ff8c8c]">9 failed, 1 error in 1.17s</p>
      <p className="mt-2 text-white/40">$ upgradepilot migrate && python -m pytest</p>
      <p className="mt-1 text-[#a5e082]">13 passed in 7.18s</p>
      <p className="text-[#a5e082]">legacy pattern scan: 0 matches</p>
      <p className="mt-2 text-white/40">secrets mounted: none</p>
    </div>
  );
}

function BentoApproval() {
  return (
    <div className="mt-5 w-full rounded-lg bg-white/10 p-3 backdrop-blur-sm">
      <p className="font-mono text-[9px] text-white/60">open_github_pr → oussamaelfig/briefbot</p>
      <div className="mt-2 flex gap-2">
        <span className="btn btn-blue pointer-events-none text-[11px] leading-4 font-medium">Approve — open the PR</span>
        <span className="btn pointer-events-none text-[11px] leading-4">Reject</span>
      </div>
    </div>
  );
}

function BentoPr() {
  return (
    <div className="mt-5 flex w-full items-center gap-2 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
      <span className="text-[#a5e082]">
        <Icon d={ICONS.pr} />
      </span>
      <div>
        <p className="text-sm font-semibold text-white">upgrade/openai-sdk-v2 → main</p>
        <p className="font-mono text-[9px] text-white/60">PR #1 · opened by UpgradePilot · approved by you</p>
      </div>
    </div>
  );
}

/* ---------- evidence icon row ---------- */

const EVIDENCE_POINTS: { icon: keyof typeof ICONS; title: string; blurb: string }[] = [
  {
    icon: "flask",
    title: "Reproduce first",
    blurb: "The failure is demonstrated on the target version before a single line is migrated.",
  },
  {
    icon: "shield",
    title: "Same tests, same sandbox",
    blurb:
      "Verification reruns the repository's full test suite in the same sandbox — tests are migrated only where the new API demands it, never trimmed to pass.",
  },
  {
    icon: "scan",
    title: "Legacy-pattern scan",
    blurb: "A final sweep proves zero calls to the old API surface remain anywhere in the repo.",
  },
  {
    icon: "hand",
    title: "Human-gated",
    blurb: "The evidence is presented to a person. Nothing reaches GitHub until they approve.",
  },
];

/* ---------- page ---------- */

export function Landing() {
  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      <Nav />

      {/* hero */}
      <div className="relative isolate px-6 lg:px-8">
        <div className="mx-auto max-w-3xl pt-8 md:pt-12 lg:pt-20">
          <div className="text-center">
            <h1 className="text-xxl font-bold tracking-tighter text-ink sm:text-[44px] sm:leading-[48px] md:text-display md:leading-[1.05]">
              From breaking change to verified PR.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-ink-secondary md:mt-5">
              UpgradePilot is an autonomous agent that reads live migration docs, reproduces your
              upgrade failure in a sandbox, migrates the code, proves it with tests — and only then
              asks a human to ship the pull request.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/mission" className="btn btn-blue btn-lg">
                Open Mission Control
              </Link>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn btn-lg">
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* hero visual + numbered features */}
      <section className="px-4 pb-12 pt-10 md:px-8 lg:pb-24 lg:pt-16">
        <div className="mx-auto w-full max-w-[1200px] pb-6">
          <DashboardMock />
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 pt-8 md:grid-cols-3">
          <div>
            <div className="font-mono text-ink-tertiary">01</div>
            <div className="my-2 text-lg font-semibold text-ink md:text-xxl md:tracking-tight">Read the docs, live</div>
            <p className="text-md leading-8 text-ink-secondary">
              Bright Data scrapes the dependency&apos;s official migration guide from the live web.
              Breaking changes are extracted into a schema-validated contract — with provenance,
              and automatic source recovery when pages drift.
            </p>
          </div>
          <div>
            <div className="font-mono text-ink-tertiary">02</div>
            <div className="my-2 text-lg font-semibold text-ink md:text-xxl md:tracking-tight">Prove it in a sandbox</div>
            <p className="text-md leading-8 text-ink-secondary">
              A Daytona sandbox reproduces the failure on the new version, applies the migration,
              and reruns your test suite. No credentials ever enter the sandbox — evidence comes
              out, secrets never go in.
            </p>
          </div>
          <div>
            <div className="font-mono text-ink-tertiary">03</div>
            <div className="my-2 text-lg font-semibold text-ink md:text-xxl md:tracking-tight">Ship a real PR</div>
            <p className="text-md leading-8 text-ink-secondary">
              After a human approves the evidence, the agent creates the branch and opens the
              actual GitHub pull request. Not a suggestion, not a diff dump — a reviewed,
              verified PR.
            </p>
          </div>
        </div>
      </section>

      {/* how it works — blue full-bleed band */}
      <section
        id="how-it-works"
        className="w-full overflow-hidden px-4 pb-12 md:px-8 lg:pb-24"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, #5ea0f2 0%, rgba(94,160,242,0) 55%), radial-gradient(110% 80% at 90% 100%, #1a5fc4 0%, rgba(26,95,196,0) 60%), linear-gradient(160deg, #3d8bef 0%, #2f80ed 55%, #2470da 100%)",
        }}
      >
        <div className="mx-auto max-w-2xl pt-8 pb-4 text-center md:py-16 lg:pt-24 lg:pb-12">
          <h2 className="text-xxl font-bold tracking-tighter text-white md:text-[44px] md:leading-[48px]">
            One mission, seven stages
          </h2>
          <p className="mt-2 text-lg leading-8 text-white md:mt-4">
            Every migration runs the same auditable pipeline, streamed live to Mission Control.
            You watch the agent work — and it cannot skip the gate at stage six.
          </p>
        </div>
        <PipelineCard />
        {/* integrations bar */}
        <div className="relative z-10 mx-auto mt-10 flex w-full max-w-7xl flex-col items-center space-y-6 rounded-xl bg-ink p-10 lg:flex-row lg:space-x-10 lg:space-y-0">
          <div className="flex space-x-6">
            {[
              ["BD", "Bright Data"],
              ["DY", "Daytona"],
              ["GH", "GitHub"],
              ["HN", "Harness"],
            ].map(([initials, name]) => (
              <div
                key={name}
                className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-white font-mono text-sm font-semibold text-ink transition-all hover:scale-105"
                title={name}
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="max-w-2xl grow text-center text-white opacity-50 lg:text-left">
            UpgradePilot runs on Harness TrueForge and speaks MCP end to end: Bright Data for live
            release documentation, Daytona for disposable verification sandboxes, and the GitHub
            MCP for the final pull request.
          </p>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn btn-lg shrink-0">
            View the source
          </a>
        </div>
      </section>

      {/* capabilities — gradient bento */}
      <section id="capabilities" className="w-full bg-white px-4 pb-8 md:px-8 lg:pb-16">
        <div className="mx-auto max-w-7xl pt-8 md:py-16 lg:pt-24">
          <div className="flex max-w-2xl flex-col items-stretch md:items-start">
            <h2 className="text-xxl font-bold tracking-tighter md:text-[44px] md:leading-[48px]">
              An agent you can audit
            </h2>
            <p className="mt-2 text-lg leading-8 text-ink-secondary md:mt-4">
              Every claim UpgradePilot makes is backed by a source URL, a test run, or a human
              decision — and all of it streams into Mission Control as it happens.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-8 md:grid-cols-3 md:pt-16">
            <div className="relative flex flex-col overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-green-700 px-6 pt-8 text-white md:col-span-2 md:px-12">
              <div className="pb-1 text-lg font-semibold">Live release intelligence</div>
              <p className="mb-5 leading-6 md:w-2/3">
                The agent reads the migration guide the way you would — from the publisher&apos;s
                live site. Extractions must validate against a JSON schema, and only
                publisher-owned sources are trusted.
              </p>
              <div className="relative flex grow items-end">
                <BentoMiniTable />
              </div>
              <div className="absolute inset-x-0 -bottom-5 z-20 h-10 bg-gradient-to-t from-green-800/60 to-transparent" />
            </div>
            <div className="relative flex flex-col overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-purple-800 px-6 py-8 text-white md:row-span-2 md:px-8">
              <div className="pb-1 text-lg font-semibold">Credential-free verification</div>
              <p className="leading-6">
                Reproduce, migrate, verify — all inside a disposable Daytona sandbox. Your API
                keys and tokens stay outside. The only thing that leaves the sandbox is evidence.
              </p>
              <div className="flex grow items-end">
                <BentoTerminal />
              </div>
              <div className="absolute inset-x-0 -bottom-10 z-20 h-24 bg-gradient-to-t from-purple-900/70 to-transparent" />
            </div>
            <div className="flex flex-col overflow-hidden rounded-xl bg-gradient-to-tr from-gray-900 to-gray-700 px-6 py-8 text-white md:px-12">
              <div className="pb-1 text-lg font-semibold">Harness-enforced approval</div>
              <p className="leading-6 opacity-80">
                The approval gate is platform policy, not a prompt. The agent is paused by the
                harness until a human clicks Approve on the evidence.
              </p>
              <BentoApproval />
            </div>
            <div className="flex flex-col overflow-hidden rounded-xl bg-blue-700 px-6 py-8 text-white md:px-12">
              <div className="pb-1 text-lg font-semibold">Real PRs, not suggestions</div>
              <p className="leading-6 opacity-80">
                The finale is a genuine pull request on your repository — branch, commits, and
                description — opened through the GitHub MCP.
              </p>
              <BentoPr />
            </div>
          </div>
        </div>
      </section>

      {/* evidence — black rounded section */}
      <section id="evidence" className="w-full px-4 py-14 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl rounded-2xl bg-ink">
          <div className="mx-auto max-w-3xl px-4 py-8 text-center md:py-16 lg:pt-24">
            <h2 className="text-xxl font-bold tracking-tighter text-white md:text-[44px] md:leading-[48px]">
              The proof, not the promise
            </h2>
            <p className="mt-2 text-lg leading-8 text-white opacity-50 md:mt-4">
              From the recorded live demo mission — openai 0.28.1 → 2.x on a real repository.
              The same suite that failed on the new SDK passes after migration, with zero legacy
              call sites left behind. The full run output is public in the{" "}
              <a
                href="https://github.com/oussamaelfig/briefbot/pull/2"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/40 underline-offset-2 hover:decoration-white"
              >
                resulting pull request
              </a>
              .
            </p>
          </div>
          <div className="relative w-full px-4 md:px-24">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <div className="rounded-lg bg-white p-5 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">
                    Before migration
                  </span>
                  <span className="rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-secondary">
                    openai 2.48.0 · unmigrated code
                  </span>
                </div>
                <p className="font-mono text-xxl font-bold tracking-tight text-bad-deep">9 failed</p>
                <p className="mt-1 font-mono text-sm text-ink-secondary">1 passed · 1 error · exit 1</p>
                <div className="mt-3 rounded-md bg-ink p-3 font-mono text-[10px] leading-4">
                  <p className="text-white/40">$ python -m pytest</p>
                  <p className="mt-1 text-[#ff8c8c]">FAILED test_summarizer.py::test_returns_summary_text</p>
                  <p className="text-[#ff8c8c]">FAILED test_search.py::test_finds_related_budget_note</p>
                  <p className="text-white/60">openai.lib._old_api.APIRemovedInV1</p>
                </div>
              </div>
              <div className="hidden items-center md:flex">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                  <path d="M8 20h22m0 0-8-8m8 8-8 8" stroke="#8ac866" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="rounded-lg bg-white p-5 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">
                    After migration
                  </span>
                  <span className="rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-secondary">
                    openai 2.48.0 · migrated code
                  </span>
                </div>
                <p className="font-mono text-xxl font-bold tracking-tight text-ok-deep">13 passed</p>
                <p className="mt-1 font-mono text-sm text-ink-secondary">0 failed · 0 legacy call sites · exit 0</p>
                <div className="mt-3 rounded-md bg-ink p-3 font-mono text-[10px] leading-4">
                  <p className="text-white/40">$ python -m pytest && legacy-scan</p>
                  <p className="mt-1 text-[#a5e082]">13 passed in 7.18s</p>
                  <p className="text-[#a5e082]">legacy pattern scan: 0 matches</p>
                  <p className="text-white/60">evidence attached to approval request</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pb-8 pt-6 md:grid-cols-2 md:gap-8 md:px-24 md:pb-12 md:pt-10 lg:grid-cols-4">
            {EVIDENCE_POINTS.map((point) => (
              <div key={point.title}>
                <div className="my-2 flex items-center space-x-2 text-white">
                  <Icon d={ICONS[point.icon]} />
                  <span className="text-md font-semibold">{point.title}</span>
                </div>
                <p className="text-md leading-7 text-white opacity-50">{point.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ticker */}
      <section className="relative w-full bg-white pb-12 lg:pb-28">
        <div className="mx-auto max-w-2xl pt-8 pb-6 text-center md:py-12">
          <h2 className="text-xxl font-bold tracking-tighter text-ink md:text-[44px] md:leading-[48px]">
            ...and it&apos;s all in the open.
          </h2>
        </div>
        <MarqueeRow
          duration={64}
          items={[
            "Schema-validated breaking changes",
            "Publisher allowlist for sources",
            "Drift detection with automatic recovery",
            "SSE live mission stream",
            "Deterministic mission snapshots",
            "Replay-gap detection on reconnect",
          ]}
        />
        <MarqueeRow
          duration={78}
          items={[
            "Daytona sandbox per mission",
            "Baseline reproduced before migrating",
            "Legacy-pattern scan after migration",
            "Exact external action shown before approval",
            "Approve or reject with one click",
            "Full agent activity feed",
          ]}
        />
        <MarqueeRow
          duration={70}
          items={[
            "GitHub PR via MCP",
            "Branch and base named up front",
            "Evidence summary attached to every approval",
            "Source provenance on every breaking change",
            "Mission Control works on any screen",
            "Zero credentials in the sandbox",
          ]}
        />
      </section>

      {/* final CTA */}
      <section className="relative isolate px-8">
        <div className="mx-auto max-w-2xl py-20 text-center md:py-28">
          <div className="mx-auto flex justify-center">
            <LogoMark size={72} color="#2f80ed" />
          </div>
          <p className="mt-5 text-lg leading-8 text-ink-secondary">
            Your dependencies won&apos;t upgrade themselves. Actually — now they will. Watch a
            mission run end to end in Mission Control.
          </p>
          <Link to="/mission" className="btn btn-blue btn-lg mt-6">
            Open Mission Control
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="w-full bg-ink px-4 pt-8 pb-12 text-white md:px-8 lg:pt-16 lg:pb-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center space-y-2 md:flex-row md:space-x-3 md:space-y-0">
          <LogoMark size={24} color="#ffffff" />
          <div className="grow font-medium">
            UpgradePilot © 2026
            <span className="font-normal opacity-50"> · Built for the Harness AI Hackathon</span>
          </div>
          <div className="text-body">
            <Link to="/mission" className="text-white">
              Mission Control
            </Link>
            <span className="opacity-50"> · </span>
            <a className="text-white" href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <span className="opacity-50"> · </span>
            <a className="text-white" href="https://brightdata.com" target="_blank" rel="noreferrer">
              Bright Data
            </a>
            <span className="opacity-50"> · </span>
            <a className="text-white" href="https://www.daytona.io" target="_blank" rel="noreferrer">
              Daytona
            </a>
            <span className="opacity-50"> · </span>
            <a className="text-white" href="https://www.harness.io" target="_blank" rel="noreferrer">
              Harness
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
