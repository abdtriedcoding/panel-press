"use client";

import { useEffect, useState } from "react";

export function LandingHero() {
  const [pagesLast24h, setPagesLast24h] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.pagesLast24h === "number") {
          setPagesLast24h(data.pagesLast24h);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="relative pt-2 pb-8 sm:pt-6 sm:pb-12 lg:pt-0 lg:pb-10">
      <div className="mb-7 h-1.5 w-24 bg-spot sm:mb-9" />

      <h1 className="max-w-3xl font-display text-[clamp(2.25rem,4.4vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-ink">
        <span className="block whitespace-nowrap">Write the scene.</span>
        <span className="block whitespace-nowrap">Get the page.</span>
      </h1>

      <div className="mt-7 max-w-lg border-l-2 border-ink pl-5">
        <p className="text-base leading-relaxed text-foreground sm:text-lg">
          Panel Press turns a short description into a finished comic page. Pick a
          look, describe what happens, and read it panel by panel.
        </p>
        {pagesLast24h !== null && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            {pagesLast24h.toLocaleString()} pages drawn in the last day
          </p>
        )}
      </div>
    </header>
  );
}
