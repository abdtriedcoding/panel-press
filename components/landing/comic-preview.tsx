const pages = [
  {
    style: "American modern",
    line: "\"And a hero shall rise!\"",
    images: ["/american.jpg", "/comic-book-superhero-action-scene-noir-style-dark-.jpg", "/comic-book-next-scene-continuation.jpg"],
  },
  {
    style: "Manga",
    line: "\"Time to save the world!\"",
    images: ["/manga.png", "/comic-book-rooftop-confrontation-superhero-villain.jpg", "/american.jpg"],
  },
  {
    style: "Noir",
    line: "\"The city needs a hero...\"",
    images: ["/noir.jpg", "/comic-book-superhero-action-scene-noir-style-dark-.jpg", "/manga.png"],
  },
  {
    style: "Vintage",
    line: "\"Super action\"",
    images: ["/vintage-superman.jpg", "/american.jpg", "/comic-book-next-scene-continuation.jpg"],
  },
];

export function ComicPreview({
  currentPage,
  goToPage,
}: {
  currentPage: number;
  goToPage: (page: number) => void;
}) {
  const page = pages[currentPage - 1] ?? pages[0];

  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden border-t-2 border-ink bg-paper py-14 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-t-0 lg:py-0">
      <div className="halftone pointer-events-none absolute inset-0 opacity-[0.08]" />

      <div className="sheet-in relative z-10 w-full max-w-[620px] px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>Proof sheet</span>
          <span>{String(currentPage).padStart(2, "0")} / 04</span>
        </div>

        <div className="proof-sheet relative p-3 sm:p-4">
          <span className="register-mark absolute -top-3 left-4 h-3 w-3" />
          <span className="register-mark absolute -top-3 right-4 h-3 w-3" />
          <span className="register-mark absolute -bottom-3 left-4 h-3 w-3" />
          <span className="register-mark absolute -bottom-3 right-4 h-3 w-3" />

          <div className="border-2 border-ink bg-ink p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="relative col-span-2 aspect-[16/7] overflow-hidden bg-ink">
                <img
                  src={page.images[0]}
                  alt={`${page.style} panel one`}
                  className="h-full w-full scale-110 object-cover grayscale contrast-125"
                />
                <div className="pointer-events-none absolute inset-0 bg-cyan/10 mix-blend-multiply" />
                <span className="absolute bottom-1.5 left-1.5 bg-paper px-1.5 py-0.5 font-mono text-[9px] text-ink">
                  01
                </span>
              </div>
              {page.images.slice(1).map((image, index) => (
                <div key={image} className="relative aspect-[4/3] overflow-hidden bg-ink">
                  <img
                    src={image}
                    alt={`${page.style} panel ${index + 2}`}
                    className="h-full w-full scale-110 object-cover grayscale contrast-125"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-cyan/10 mix-blend-multiply" />
                  <span className="absolute bottom-1.5 left-1.5 bg-paper px-1.5 py-0.5 font-mono text-[9px] text-ink">
                    0{index + 2}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="max-w-[72%] border-2 border-ink bg-spot px-3 py-2 text-sm font-medium leading-snug text-ink shadow-[4px_4px_0_var(--ink)]">
              {page.line}
            </p>
            <span className="pb-1 font-mono text-[11px] text-muted-foreground">
              {page.style}
            </span>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-2">
          {pages.map((item, index) => (
            <button
              key={item.style}
              onClick={() => goToPage(index + 1)}
              className={`h-9 w-9 border-2 border-ink font-mono text-xs transition-colors ${
                currentPage === index + 1
                  ? "bg-cyan text-white"
                  : "bg-card text-ink hover:bg-spot"
              }`}
              aria-label={`Go to page ${index + 1}`}
              aria-current={currentPage === index + 1 ? "true" : undefined}
            >
              {index + 1}
            </button>
          ))}
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">
            Turn the page
          </span>
        </div>
      </div>
    </section>
  );
}
