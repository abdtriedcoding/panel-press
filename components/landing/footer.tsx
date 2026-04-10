"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { FeedbackModal } from "@/components/feedback-modal";

export function Footer() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <footer className="border-t-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            Panel Press, made with Together AI. Demo mode uses your Cohere key for
            the script.
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-1.5 border-b border-transparent pb-0.5 text-ink transition-colors hover:border-ink"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Send feedback
            </button>
            <Link
              href="https://github.com/abdtriedcoding/panel-press"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-transparent pb-0.5 text-ink transition-colors hover:border-ink"
            >
              Source
            </Link>
          </div>
        </div>
      </footer>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}
