import { useEffect, useState } from "react";

/**
 * Minimal history-API router: two routes and zero dependencies is all this
 * app needs. The server already rewrites every non-api path to index.html.
 */
export function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useRoute(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

export function Link({
  to,
  className,
  children,
  title,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <a
      href={to}
      title={title}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
        window.scrollTo(0, 0);
      }}
    >
      {children}
    </a>
  );
}
