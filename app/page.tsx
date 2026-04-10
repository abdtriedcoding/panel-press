"use client";

import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero-section";
import { ComicCreationForm } from "@/components/landing/comic-creation-form";
import { ComicPreview } from "@/components/landing/comic-preview";
import { useState, useEffect } from "react";

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("noir");
  const [characterFiles, setCharacterFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev === 4 ? 1 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goToPage = (page: number) => setCurrentPage(page);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col justify-center border-ink px-5 py-12 sm:px-8 lg:border-r-2 lg:px-12 lg:py-14 xl:px-20">
          <div className="w-full max-w-xl">
            <LandingHero />
            <div className="animate-fade-in-up animation-delay-100 opacity-0">
              <ComicCreationForm
                prompt={prompt}
                setPrompt={setPrompt}
                style={style}
                setStyle={setStyle}
                characterFiles={characterFiles}
                setCharacterFiles={setCharacterFiles}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
          </div>
        </div>

        <ComicPreview currentPage={currentPage} goToPage={goToPage} />
      </main>

      <Footer />
    </div>
  );
}
