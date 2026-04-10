"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useS3Upload } from "next-s3-upload";
import { useAuth, SignInButton, useClerk } from "@clerk/nextjs";
import { COMIC_STYLES } from "@/lib/constants";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useApiKey } from "@/hooks/use-api-key";
import { isContentPolicyViolation } from "@/lib/utils";
import { ApiKeyModal } from "@/components/api-key-modal";
import { MAX_SYSTEM_LENGTH, MAX_USER_PROMPT } from "@/lib/prompt";

interface ComicCreationFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  style: string;
  setStyle: (style: string) => void;
  characterFiles: File[];
  setCharacterFiles: (files: File[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type DemoPanel = { scene: string; narration: string; dialogue: string; svg: string };
type DemoResult = {
  demo: boolean;
  title: string;
  description: string;
  imageUrl: string;
  panels: DemoPanel[];
};

const DEFAULT_STYLE = 'noir';
const STYLE_STORAGE_KEY = 'comic-style-preference';

export function ComicCreationForm({
  prompt,
  setPrompt,
  style: initialStyle,
  setStyle: setParentStyle,
  characterFiles,
  setCharacterFiles,
  isLoading,
  setIsLoading,
}: ComicCreationFormProps) {
  const router = useRouter();
  const [loadingStep, setLoadingStep] = useState(0);
  const { toast } = useToast();
  const { uploadToS3 } = useS3Upload();
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const [apiKey, setApiKey] = useApiKey();
  const hasApiKey = !!apiKey;
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState<number | null>(null);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);

  // Initialize style with initial value, load from localStorage after mount
  const [style, setStyle] = useState(initialStyle || DEFAULT_STYLE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const PROMPT_STORAGE_KEY = 'comic-prompt-draft';


  useEffect(() => {
    if (isLoading) {
      setShowStyleDropdown(false);
    }
  }, [isLoading]);

  useEffect(() => {
    // Auto-focus the textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Persist prompt to localStorage
  useEffect(() => {
    if (prompt) {
      localStorage.setItem(PROMPT_STORAGE_KEY, prompt);
    }
  }, [prompt]);

  // Restore prompt from localStorage only once on mount
  useEffect(() => {
    const saved = localStorage.getItem(PROMPT_STORAGE_KEY);
    if (saved && !prompt) {
      setPrompt(saved);
    }
  }, []); // Run only on mount

  // Load style preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STYLE_STORAGE_KEY);
    if (saved) {
      setStyle(saved);
    }
  }, []);

  // Save style to localStorage and sync with parent
  useEffect(() => {
    localStorage.setItem(STYLE_STORAGE_KEY, style);
    setParentStyle(style);
  }, [style, setParentStyle]);

  // Fetch credits on mount
  useEffect(() => {
    if (isSignedIn && !hasApiKey) {
      const fetchCredits = async () => {
        try {
          const response = await fetch('/api/check-credits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hasApiKey: false }),
          });
          const data = await response.json();
          if (response.ok) {
            setCreditsRemaining(data.creditsRemaining);
          }
        } catch (error) {
          console.error('Error fetching credits:', error);
        }
      };
      fetchCredits();
    } else if (hasApiKey) {
      setCreditsRemaining(null); // Unlimited
    }
  }, [isSignedIn, hasApiKey]);

  // Keyboard shortcut for form submission
  useKeyboardShortcut(() => {
    if (!isLoading && prompt.trim()) {
      if (!isSignedIn) {
        openSignIn();
      } else {
        handleCreate();
      }
    }
  }, { disabled: isLoading || !isLoaded });

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles = Array.from(newFiles).filter((file) =>
      file.type.startsWith("image/")
    );
    const totalFiles = [...characterFiles, ...validFiles].slice(0, 2); // Max 2 files

    setCharacterFiles(totalFiles);

    // Generate previews for all files
    const newPreviews: string[] = [];
    totalFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews[index] = e.target?.result as string;
        if (newPreviews.filter(Boolean).length === totalFiles.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = characterFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setCharacterFiles(newFiles);
    setPreviews(newPreviews);
    setShowPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setShowStyleDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt to generate your comic",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);

    // Progress through loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 3500);

    try {
      // Check credits
      const hasApiKey = !!apiKey;
      if (!hasApiKey) {
        const creditsResponse = await fetch('/api/check-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hasApiKey }),
        });
        const creditsData = await creditsResponse.json();

        if (!creditsResponse.ok) {
          toast({
            title: "Error",
            description: "Failed to check credits",
            variant: "destructive",
          });
          clearInterval(stepInterval);
          setIsLoading(false);
          return;
        }

        if (creditsData.creditsRemaining === 0) {
          setShowApiModal(true);
          clearInterval(stepInterval);
          setIsLoading(false);
          return;
        }
      }

      const characterUploads = await Promise.all(
        characterFiles.map((file) => uploadToS3(file).then(({ url }) => url))
      );

      // Use API to create story and generate first page
      const response = await fetch("/api/generate-comic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          ...(apiKey && { apiKey }),
          style,
          characterImages: characterUploads,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 && errorData.isRateLimited) {
          throw new Error(errorData.error);
        }
        throw new Error(errorData.error || "Failed to create story");
      }

      const result = await response.json();

      if (result.demo) {
        setDemoResult(result as DemoResult);
        clearInterval(stepInterval);
        setIsLoading(false);
        return;
      }

      // Clear the draft since submission was successful
      localStorage.removeItem(PROMPT_STORAGE_KEY);
      clearInterval(stepInterval);
      // Redirect to the story editor using slug
      router.push(`/story/${result.storySlug}`);
    } catch (error) {
      console.error("Error creating comic:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create comic. Please try again.";
      let title = "Creation failed";
      if (isContentPolicyViolation(errorMessage)) {
        title = "Content policy violation";
      }
      toast({
        title,
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    setShowApiModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isEnter = e.key === "Enter" || e.key === "\n" || e.keyCode === 13;
    const isModifierPressed = e.shiftKey || e.ctrlKey || e.metaKey; // metaKey for Cmd on Mac

    if (isEnter && isModifierPressed) {
      e.preventDefault();
      handleCreate();
    }
  };

  const loadingSteps = [
    "Enhancing prompt...",
    "Generating scenes...",
    "Creating your comic...",
    "Finishing up...",
  ];

  return (
    <>
      <div className="border-2 border-ink bg-card p-4 shadow-[6px_6px_0_var(--ink)] transition-colors focus-within:border-cyan sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="font-mono text-[11px] text-muted-foreground">
              Your scene
            </label>
            <span className="font-mono text-[11px] text-muted-foreground">
              Shift + Enter to draw
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(
              0, MAX_USER_PROMPT))
            }
            placeholder="A cat detective walks a rainy street at midnight."
            disabled={isLoading}
            maxLength={MAX_USER_PROMPT}
            className="ruled-paper h-20 w-full resize-none border-none bg-transparent text-base leading-relaxed text-ink placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="mt-3 flex flex-col gap-3 border-t border-ink/20 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
              {characterFiles.length > 0 ? (
                <div className="flex items-center gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group/thumb">
                      <button
                        onClick={() => setShowPreview(index)}
                        className="h-8 w-8 overflow-hidden border-2 border-ink transition-colors hover:border-cyan"
                      >
                        <img
                          src={preview || "/placeholder.svg"}
                          alt={`Character ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLoading) removeFile(index);
                        }}
                        disabled={isLoading}
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center border-2 border-ink bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover/thumb:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                  {characterFiles.length < 2 && (
                    <button
                      onClick={() =>
                        !isLoading && fileInputRef.current?.click()
                      }
                      disabled={isLoading}
                      className="flex h-8 w-8 items-center justify-center border-2 border-dashed border-ink/40 text-muted-foreground transition-colors hover:border-cyan hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Add a character reference</span>
                  <span className="hidden text-muted-foreground/60 sm:inline">
                    Up to 2
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
              <div className="relative dropdown-container z-60">
                <button
                  onClick={() => {
                    if (!isLoading) setShowStyleDropdown(!showStyleDropdown);
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2 border-2 border-ink bg-card px-3 py-1.5 text-xs text-ink transition-colors hover:bg-spot disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                  <span>{COMIC_STYLES.find((s) => s.id === style)?.name}</span>
                </button>

                {showStyleDropdown && (
                  <div className="absolute bottom-full left-0 z-70 mb-2 w-44 border-2 border-ink bg-card p-1 shadow-[4px_4px_0_var(--ink)] sm:left-auto sm:right-0">
                    {COMIC_STYLES.map((styleOption) => (
                      <button
                        key={styleOption.id}
                        onClick={() => {
                          setStyle(styleOption.id);
                          setShowStyleDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${style === styleOption.id
                          ? "bg-cyan text-white"
                          : "text-ink hover:bg-spot"
                          }`}
                      >
                        <span>{styleOption.name}</span>
                        {style === styleOption.id && (
                          <Check className="w-3 h-3" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

      {showPreview !== null && previews[showPreview] && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setShowPreview(null)}
        >
          <div className="proof-sheet relative z-101 max-h-[80vh] max-w-2xl p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-102 h-8 w-8 hover:bg-spot"
              onClick={() => setShowPreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={previews[showPreview] || "/placeholder.svg"}
              alt="Character preview"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}

      <div className="mt-7">
        {!isLoaded ? (
          <div className="h-12" />
        ) : isSignedIn ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleCreate}
              disabled={isLoading || !prompt.trim()}
              className="flex h-12 items-center justify-center gap-3 border-2 border-ink bg-ink px-8 text-sm font-semibold text-paper transition-colors hover:bg-cyan hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingSteps[loadingStep]}
                </>
              ) : (
                "Draw the page"
              )}
            </button>
            <div className="font-mono text-[11px] text-muted-foreground">
              {hasApiKey
                ? "Using your key"
                : creditsRemaining !== null
                  ? `${creditsRemaining} credits left`
                  : "Checking credits"}
            </div>
          </div>
        ) : (
          <SignInButton mode="modal">
            <button className="h-12 border-2 border-ink bg-ink px-8 text-sm font-semibold text-paper transition-colors hover:bg-cyan hover:text-ink">
              Sign in to draw
            </button>
          </SignInButton>
        )}
      </div>

      {demoResult && (
        <section
          data-testid="demo-result"
          className="mt-9 border-2 border-ink bg-card p-4 shadow-[6px_6px_0_var(--ink)]"
        >
          <div className="mb-4 flex items-start justify-between gap-3 border-b-2 border-ink pb-3">
            <div>
              <p className="font-mono text-[11px] text-muted-foreground">
                Finished page
              </p>
              <h2
                data-testid="demo-title"
                className="mt-1 font-display text-2xl font-bold leading-tight text-ink"
              >
                {demoResult.title}
              </h2>
              {demoResult.description && (
                <p
                  data-testid="demo-description"
                  className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground"
                >
                  {demoResult.description}
                </p>
              )}
            </div>
            <button
              onClick={() => setDemoResult(null)}
              className="border-2 border-ink px-2 py-1 font-mono text-[11px] transition-colors hover:bg-spot"
              aria-label="Clear result"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 bg-ink p-1.5">
            {demoResult.panels.map((panel, index) => (
              <img
                key={index}
                data-testid={`demo-panel-${index + 1}`}
                src={panel.svg}
                alt={`Panel ${index + 1}: ${panel.scene}`}
                className={`w-full border-2 border-ink ${index === 0 ? "col-span-2" : ""}`}
              />
            ))}
          </div>
        </section>
      )}

      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSubmit={handleApiKeySubmit}
      />
    </>
  );
}