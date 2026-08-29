import { useEffect } from "react";
import { Landing } from "./pages/Landing";
import { MissionControl } from "./pages/MissionControl";
import { Link, useRoute } from "./router";

const TITLES: Record<string, string> = {
  "/": "UpgradePilot — From breaking change to verified PR",
  "/mission": "Mission Control — UpgradePilot",
};

export default function App() {
  const route = useRoute();
  const path = route === "" ? "/" : route;

  useEffect(() => {
    document.title = TITLES[path] ?? "Page not found — UpgradePilot";
  }, [path]);

  if (path === "/") return <Landing />;
  if (path === "/mission") return <MissionControl />;
  // Anything else is a typo or a stale link: never mount the live dashboard
  // (and its API/SSE client) for a URL we do not recognize.
  return <NotFound path={path} />;
}

function NotFound({ path }: { path: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
      <p className="font-mono text-sm text-ink-tertiary">404</p>
      <h1 className="text-xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="text-sm text-ink-secondary">
        <code className="font-mono">{path}</code> doesn&apos;t exist here.
      </p>
      <div className="mt-2 flex gap-3">
        <Link to="/" className="btn">
          Landing page
        </Link>
        <Link to="/mission" className="btn btn-blue">
          Mission Control
        </Link>
      </div>
    </main>
  );
}
