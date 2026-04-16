import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { GraphFile } from "../detectors/types.js";
import type { CheckResult, ManifestData } from "./types.js";

function readFileSafe(filePath: string, maxChars?: number): string | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, "utf-8");
    return maxChars ? content.slice(0, maxChars) : content;
  } catch {
    return null;
  }
}

function selectKeyFiles(files: GraphFile[]): GraphFile[] {
  const priority = ["route", "api-route", "middleware", "layout"];
  const keyFiles = files.filter((f) => priority.includes(f.role));
  return keyFiles.slice(0, 10);
}

export async function checkIntent(
  projectDir: string,
  manifest: ManifestData,
  files: GraphFile[],
): Promise<CheckResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      dimension: "Intent alignment",
      score: 0,
      label: "Intent alignment",
      details: "ANTHROPIC_API_KEY not set",
      recommendations: [],
      skipped: true,
    };
  }

  const goals = manifest.goals ?? [];
  const invariants = manifest.invariants ?? [];

  if (goals.length === 0 && invariants.length === 0) {
    return {
      dimension: "Intent alignment",
      score: 0,
      label: "Intent alignment",
      details: "no goals or invariants defined",
      recommendations: ["Add goals and invariants to omamori.yaml"],
      skipped: true,
    };
  }

  const keyFiles = selectKeyFiles(files);
  const fileSamples: string[] = [];

  for (const f of keyFiles) {
    const content = readFileSafe(join(projectDir, f.path), 2000);
    if (content) {
      fileSamples.push(`--- ${f.path} (${f.role}) ---\n${content}`);
    }
  }

  if (fileSamples.length === 0) {
    return {
      dimension: "Intent alignment",
      score: 0,
      label: "Intent alignment",
      details: "no source files to analyze",
      recommendations: [],
      skipped: true,
    };
  }

  const prompt = `You are evaluating whether a software project's source code aligns with its stated goals and invariants.

Goals:
${goals.map((g) => `- ${g}`).join("\n")}

Invariants:
${invariants.map((i) => `- ${i}`).join("\n")}

Source files:
${fileSamples.join("\n\n")}

Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "score": <0-100>,
  "summary": "one sentence summary of alignment",
  "divergences": ["divergence 1", "divergence 2"]
}

Score 90-100 if code clearly supports stated goals. Score 60-89 if mostly aligned with minor gaps. Score below 60 if significant divergence.`;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return {
        dimension: "Intent alignment",
        score: 0,
        label: "Intent alignment",
        details: "LLM returned no text",
        recommendations: [],
        skipped: true,
      };
    }

    const parsed = JSON.parse(textContent.text) as {
      score?: number;
      summary?: string;
      divergences?: string[];
    };

    const score =
      typeof parsed.score === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : 75;

    return {
      dimension: "Intent alignment",
      score,
      label: "Intent alignment",
      details: parsed.summary ?? "analysis complete",
      recommendations: parsed.divergences ?? [],
      skipped: false,
    };
  } catch {
    return {
      dimension: "Intent alignment",
      score: 0,
      label: "Intent alignment",
      details: "LLM analysis failed",
      recommendations: [],
      skipped: true,
    };
  }
}
