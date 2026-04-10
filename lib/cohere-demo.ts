import { NextResponse } from "next/server";

const COHERE_URL = "https://api.cohere.com/v2/chat";
const MODEL = process.env.COHERE_MODEL || "command-a-03-2025";

type Panel = { scene: string; narration: string; dialogue: string };
export type DemoComic = {
  title: string;
  description: string;
  style: string;
  panels: Array<Panel & { svg: string }>;
};

const PALETTES: Record<string, { bg: string; soft: string; ink: string; accent: string }> = {
  noir: { bg: "#0b1020", soft: "#1f2937", ink: "#f8fafc", accent: "#f59e0b" },
  manga: { bg: "#f8fafc", soft: "#e2e8f0", ink: "#0f172a", accent: "#dc2626" },
  superhero: { bg: "#082f49", soft: "#155e75", ink: "#fef3c7", accent: "#ef4444" },
  "vintage-comic": { bg: "#fef3c7", soft: "#fcd34d", ink: "#451a03", accent: "#b91c1c" },
  "american-comic": { bg: "#1e1b4b", soft: "#4338ca", ink: "#f8fafc", accent: "#22d3ee" },
};

const DEFAULT_PALETTE = { bg: "#1e1b4b", soft: "#4338ca", ink: "#f8fafc", accent: "#22d3ee" };

function escapeXml(value: string) {
  const entities: Record<string, string> = {
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  };
  return value.replace(/[<>&"']/g, (char) => entities[char] ?? char);
}

function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function tspans(lines: string[], x: number, y: number, fill: string, size: number, anchor = "start") {
  return lines
    .map(
      (line, index) =>
        `<tspan x="${x}" y="${y + index * (size + 6)}" fill="${fill}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" text-anchor="${anchor}">${escapeXml(line)}</tspan>`,
    )
    .join("");
}

function panelSvg(panel: Panel, index: number, style: string): string {
  const palette = PALETTES[style] ?? DEFAULT_PALETTE;
  const seed = [...(panel.scene + style)]
    .reduce((total, char) => total + char.charCodeAt(0), index * 17);
  const peakX = 120 + (seed % 340);
  const peakY = 250 + (seed % 90);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="${palette.soft}"/>
    </linearGradient>
    <pattern id="halftone" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.6" fill="${palette.ink}" opacity="0.10"/>
    </pattern>
  </defs>
  <rect width="600" height="800" fill="url(#sky)"/>
  <rect width="600" height="800" fill="url(#halftone)"/>
  <g opacity="0.55" fill="${palette.ink}">
    <rect x="0" y="${520 - (seed % 60)}" width="90" height="280"/>
    <rect x="95" y="${450 - (seed % 40)}" width="70" height="350"/>
    <rect x="430" y="${480 - (seed % 70)}" width="80" height="320"/>
    <rect x="515" y="${420 - (seed % 50)}" width="85" height="380"/>
  </g>
  <path d="M0 800 L${peakX} ${peakY} L600 800 Z" fill="${palette.accent}" opacity="0.30"/>
  <path d="M0 800 L${peakX} ${peakY} L600 800 Z" fill="none" stroke="${palette.accent}" stroke-width="5" opacity="0.65"/>
  <g stroke="${palette.accent}" stroke-width="3" opacity="0.5">
    <line x1="${peakX}" y1="${peakY - 40}" x2="${peakX - 70}" y2="${peakY - 130}"/>
    <line x1="${peakX}" y1="${peakY - 40}" x2="${peakX}" y2="${peakY - 150}"/>
    <line x1="${peakX}" y1="${peakY - 40}" x2="${peakX + 70}" y2="${peakY - 130}"/>
  </g>
  <rect x="26" y="26" width="548" height="112" rx="10" fill="${palette.ink}" opacity="0.94"/>
  <text x="44" y="56" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="bold" letter-spacing="3" fill="${palette.accent}">PANEL ${index + 1}</text>
  <text>${tspans(wrap(panel.narration || panel.scene, 44), 44, 84, palette.bg, 22)}</text>
  <g>
    <rect x="48" y="576" width="504" height="152" rx="26" fill="${palette.ink}"/>
    <path d="M150 728 L120 770 L196 728 Z" fill="${palette.ink}"/>
    <text>${tspans(wrap(panel.dialogue || "...", 34), 300, 622, palette.bg, 24, "middle")}</text>
  </g>
  <text x="44" y="772" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="${palette.ink}" opacity="0.7">${escapeXml(style)}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function clip(value: unknown, max: number, fallback = ""): string {
  const text = typeof value === "string" ? value.trim() : fallback;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function askCohere(prompt: string, style: string, apiKey?: string) {
  const key = apiKey || process.env.COHERE_API_KEY;
  if (!key) {
    throw Object.assign(new Error("COHERE_API_KEY is not configured"), { status: 503 });
  }

  const system =
    "You write very short comic book scripts. Reply with only one JSON object and no other text, no markdown, no code fences.";
  const user = [
    `Comic style: ${style}`,
    `Story idea: ${prompt}`,
    "",
    "Return exactly this shape with 3 panels:",
    '{"title":"<=50 chars","description":"<=140 chars","panels":[{"scene":"<=60 chars","narration":"<=70 chars","dialogue":"<=60 chars"}]}',
  ].join("\n");

  const response = await fetch(COHERE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 450,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw Object.assign(
      new Error(`Cohere request failed (${response.status}): ${detail.slice(0, 240)}`),
      { status: 502 },
    );
  }

  const data = await response.json();
  const raw = Array.isArray(data?.message?.content)
    ? data.message.content.map((block: { text?: string }) => block.text || "").join("")
    : typeof data?.text === "string"
      ? data.text
      : "";

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("Cohere response did not contain JSON");
  }

  return JSON.parse(raw.slice(start, end + 1));
}

export async function generateDemoComic(
  prompt: string,
  style: string,
  apiKey?: string,
): Promise<DemoComic> {
  const parsed = await askCohere(prompt, style, apiKey);
  const rawPanels = Array.isArray(parsed?.panels) ? parsed.panels : [];

  const panels: Panel[] = [0, 1, 2].map((index) => ({
    scene: clip(rawPanels[index]?.scene, 60, prompt),
    narration: clip(rawPanels[index]?.narration, 70, prompt),
    dialogue: clip(rawPanels[index]?.dialogue, 60, "…"),
  }));

  return {
    title: clip(parsed?.title, 50, prompt.slice(0, 50)),
    description: clip(parsed?.description, 140),
    style,
    panels: panels.map((panel, index) => ({
      ...panel,
      svg: panelSvg(panel, index, style),
    })),
  };
}

export function demoErrorResponse(error: unknown) {
  const status = typeof (error as { status?: number })?.status === "number"
    ? (error as { status: number }).status
    : 500;
  const message = error instanceof Error ? error.message : "Comic generation failed";
  return NextResponse.json({ error: message }, { status });
}
