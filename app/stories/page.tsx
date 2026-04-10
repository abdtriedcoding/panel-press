"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { StoryLoader } from "@/components/ui/story-loader";
import { COMIC_STYLES } from "@/lib/constants";

interface Story {
  id: string;
  title: string;
  slug: string;
  style: string;
  createdAt: string;
  pageCount: number;
  coverImage: string | null;
  lastUpdated?: string;
}

export default function StoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch("/api/stories");
      if (!response.ok) {
        throw new Error("Failed to fetch stories");
      }
      const data = await response.json();
      setStories(data.stories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stories");
    } finally {
      setIsLoading(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="flex flex-1 items-center justify-center">{children}</main>
    </div>
  );

  if (isLoading) {
    return shell(<StoryLoader text="Opening your library..." />);
  }

  if (error) {
    return shell(
      <div className="proof-sheet p-10 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchStories} className="mt-5 border-2 border-ink bg-ink text-paper hover:bg-cyan hover:text-ink">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-12 sm:px-8 lg:px-12">
        <div className="mb-10 flex items-end justify-between border-b-2 border-ink pb-5">
          <div>
            <p className="mb-2 font-mono text-[11px] text-muted-foreground">
              Your library
            </p>
            <h1 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">
              Comic shelf
            </h1>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            {stories.length} {stories.length === 1 ? "story" : "stories"}
          </p>
        </div>

        {stories.length === 0 ? (
          <div className="animate-fade-in-up py-16 text-center">
            <div className="mx-auto mb-8 flex h-56 w-44 items-center justify-center border-2 border-dashed border-ink/40">
              <Plus className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <h2 className="font-display text-3xl font-bold">Nothing on the shelf yet</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Your first page starts with a short description. Write a scene and
              draw it.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="mt-8 h-12 border-2 border-ink bg-ink px-8 text-paper hover:bg-cyan hover:text-ink"
            >
              <Plus className="mr-2 h-4 w-4" />
              Draw a comic
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {stories.map((story, index) => (
              <button
                key={story.id}
                onClick={() => router.push(`/story/${story.slug}`)}
                className="proof-sheet group p-2 text-left transition-transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden border-2 border-ink bg-ink">
                  {story.coverImage ? (
                    <>
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="h-full w-full object-cover grayscale contrast-125 transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-cyan/10 mix-blend-multiply" />
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-spot" />
                    </div>
                  )}
                  <span className="absolute right-1.5 top-1.5 bg-paper px-1.5 py-0.5 font-mono text-[9px] text-ink">
                    {COMIC_STYLES.find((s) => s.id === story.style)?.name || story.style}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-display text-sm font-bold">{story.title}</h3>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {story.pageCount}p
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {new Date(story.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
