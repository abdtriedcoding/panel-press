"use client";

import { useState } from "react";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  const handleClose = () => {
    setMessage("");
    setStatus("idle");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-2 border-ink bg-card max-w-md shadow-[8px_8px_0_var(--ink)]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="w-14 h-14 border-2 border-ink bg-spot rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-indigo" />
            </div>
          </div>
          <DialogTitle className="text-xl text-center text-ink">
            Share your feedback
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            What do you think? Any bugs, ideas, or feature requests are welcome.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="mt-4 p-4 border-2 border-ink bg-card rounded-lg text-center">
            <p className="text-ink text-sm font-medium">Thanks for your feedback!</p>
            <p className="text-muted-foreground text-xs mt-1">We really appreciate it.</p>
            <Button
              onClick={handleClose}
              className="mt-4 bg-ink hover:bg-cyan text-paper"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your feedback..."
              maxLength={2000}
              rows={4}
              className="bg-input border-2 border-ink text-ink placeholder:text-muted-foreground/60 resize-none"
            />
            {status === "error" && (
              <p className="text-red-400 text-xs">Something went wrong. Please try again.</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1 text-muted-foreground hover:text-ink hover:bg-spot"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!message.trim() || status === "loading"}
                className="flex-1 gap-2 bg-ink hover:bg-cyan text-paper"
              >
                {status === "loading" ? "Sending..." : "Send Feedback"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
