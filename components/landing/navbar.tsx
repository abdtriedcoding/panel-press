"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { KeyRound, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ApiKeyModal } from "@/components/api-key-modal";
import { SignInButton, Show, useAuth } from "@clerk/nextjs";
import { useApiKey } from "@/hooks/use-api-key";

export function Navbar() {
  const [showApiModal, setShowApiModal] = useState(false);
  const [stars, setStars] = useState<string>("-");

  const { isLoaded } = useAuth();
  const pathname = usePathname();
  const [, setApiKey] = useApiKey();

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    setShowApiModal(false);
  };

  useEffect(() => {
    async function fetchStars() {
      try {
        const res = await fetch(
          "https://api.github.com/repos/abdtriedcoding/panel-press",
          {
            headers: {
              Accept: "application/vnd.github+json",
              "User-Agent": "panel-press-app",
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        setStars(
          typeof data.stargazers_count === "number"
            ? data.stargazers_count.toLocaleString()
            : "-"
        );
      } catch {
        setStars("-");
      }
    }
    fetchStars();
  }, []);

  const isOnStoriesPage = pathname === "/stories";

  if (!isLoaded)
    return <div className="h-16 w-full border-b-2 border-ink bg-paper" />;

  return (
    <>
      <nav className="sticky top-0 z-50 h-16 border-b-2 border-ink bg-paper/95">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="register-mark relative flex h-8 w-8 items-center justify-center border-2 border-ink bg-spot font-display text-[13px] font-bold leading-none">
              PP
            </span>
            <span className="font-display text-xl font-bold leading-none tracking-tight sm:text-2xl">
              Panel Press
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm sm:gap-7">
            <button
              onClick={() => setShowApiModal(true)}
              className="hidden items-center gap-1.5 border-b border-transparent py-1 transition-colors hover:border-ink sm:flex"
            >
              <KeyRound className="h-4 w-4" />
              API key
            </button>

            <a
              href="https://github.com/abdtriedcoding/panel-press"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 border-b border-transparent py-1 transition-colors hover:border-ink sm:flex"
            >
              Source
              <span className="font-mono text-xs">({stars})</span>
            </a>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="border-b border-ink py-1 font-medium">
                  Sign in
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              {isOnStoriesPage ? (
                <Link href="/" className="flex items-center gap-1.5 border-b-2 border-ink py-1 font-medium">
                  New page <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/stories" className="border-b border-transparent py-1 transition-colors hover:border-ink">
                  My stories
                </Link>
              )}
            </Show>
          </div>
        </div>
      </nav>

      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSubmit={handleApiKeySubmit}
      />
    </>
  );
}
