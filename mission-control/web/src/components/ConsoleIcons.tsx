export type ConsoleIconName =
  | "activity"
  | "agent"
  | "branch"
  | "check"
  | "changes"
  | "chevron"
  | "clock"
  | "evidence"
  | "external"
  | "file"
  | "impact"
  | "info"
  | "overview"
  | "package"
  | "repository"
  | "timeline"
  | "tool"
  | "warning"
  | "x";

const paths: Record<ConsoleIconName, React.ReactNode> = {
  activity: <path d="M2.5 10h3l1.8-4.5 3.1 9 2.1-5H17.5" />,
  agent: (
    <>
      <rect x="4" y="5" width="12" height="10" rx="2" />
      <path d="M10 2.5V5M7.5 9h.01M12.5 9h.01M7 12h6" />
    </>
  ),
  branch: (
    <>
      <circle cx="5" cy="4" r="1.5" />
      <circle cx="5" cy="16" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
      <path d="M5 5.5v9M6.5 7H11a4 4 0 0 1 4 4v3.5" />
    </>
  ),
  check: <path d="m3.5 10.5 4 4 9-9" />,
  changes: <path d="M4 5h8M4 10h12M4 15h6M14 3v4M12 5h4M13 13v4M11 15h4" />,
  chevron: <path d="m7 4 6 6-6 6" />,
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </>
  ),
  evidence: (
    <>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="m6.5 10 2.2 2.2 4.8-5" />
    </>
  ),
  external: <path d="M11 3h6v6M17 3l-8 8M8 5H4v11h11v-4" />,
  file: (
    <>
      <path d="M5 2.5h6l4 4V17.5H5z" />
      <path d="M11 2.5v4h4M7.5 10h5M7.5 13h5" />
    </>
  ),
  impact: (
    <>
      <path d="M4 3h8l4 4v10H4z" />
      <path d="M12 3v4h4M7 11h6M7 14h4" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9v5M10 6.5h.01" />
    </>
  ),
  overview: (
    <>
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="12" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="12" width="5" height="5" rx="1" />
      <rect x="12" y="12" width="5" height="5" rx="1" />
    </>
  ),
  package: (
    <>
      <path d="m3.5 6.5 6.5-3 6.5 3-6.5 3z" />
      <path d="M3.5 6.5v7l6.5 3 6.5-3v-7M10 9.5v7" />
    </>
  ),
  repository: (
    <>
      <path d="M4 3h10a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2z" />
      <path d="M7 3v14M4 14h12" />
    </>
  ),
  timeline: <path d="M6 4h11M6 10h11M6 16h11M3 4h.01M3 10h.01M3 16h.01" />,
  tool: (
    <>
      <path d="M12.5 4.2a4 4 0 0 0-4.8 5.1L3 14a2.1 2.1 0 0 0 3 3l4.7-4.7a4 4 0 0 0 5.1-4.8l-2.6 2.6-2.3-1.1-1-2.2z" />
    </>
  ),
  warning: (
    <>
      <path d="M9 3.8 2.7 15a1.3 1.3 0 0 0 1.1 2h12.4a1.3 1.3 0 0 0 1.1-2L11 3.8a1.15 1.15 0 0 0-2 0Z" />
      <path d="M10 7v4M10 14h.01" />
    </>
  ),
  x: <path d="m5 5 10 10M15 5 5 15" />,
};

export function ConsoleIcon({
  name,
  size = 16,
  className,
}: {
  name: ConsoleIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 20 20"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        {paths[name]}
      </g>
    </svg>
  );
}
