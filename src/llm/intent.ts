import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { IntentResult } from "../detectors/types.js";

function readFileSafe(filePath: string, maxChars?: number): string | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, "utf-8");
    return maxChars ? content.slice(0, maxChars) : content;
  } catch {
    return null;
  }
}

export async function generateIntent(
  projectDir: string,
  infrastructure: Record<string, unknown>,
): Promise<IntentResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  const readme = readFileSafe(join(projectDir, "README.md"), 3000);
  const packageJsonContent = readFileSafe(join(projectDir, "package.json"));

  const infrastructureSummary = Object.entries(infrastructure)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
    .join("\n");

  const contextParts: string[] = [];
  if (readme) contextParts.push(`README.md (first 3000 chars):\n${readme}`);
  if (packageJsonContent) contextParts.push(`package.json:\n${packageJsonContent}`);
  if (infrastructureSummary) contextParts.push(`Infrastructure:\n${infrastructureSummary}`);

  const context = contextParts.join("\n\n");

  const prompt = `You are analyzing a software project. Based on the context below, generate a concise intent manifest.

${context}

Respond with ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "description": "one sentence describing what this project does",
  "goals": ["goal 1", "goal 2", "goal 3"],
  "non_goals": ["non-goal 1", "non-goal 2"],
  "invariants": ["invariant 1", "invariant 2", "invariant 3"],
  "trust_boundaries": ["boundary 1", "boundary 2"]
}

Requirements:
- description: 1 clear sentence about the project's purpose
- goals: 3-5 specific, actionable goals
- non_goals: 2-3 things the project explicitly does not do
- invariants: 2-4 properties that must always be true
- trust_boundaries: 1-3 security/trust boundaries the system enforces`;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") return null;

    const parsed = JSON.parse(textContent.text) as Partial<IntentResult>;

    // Validate structure
    if (
      typeof parsed.description !== "string" ||
      !Array.isArray(parsed.goals) ||
      !Array.isArray(parsed.non_goals) ||
      !Array.isArray(parsed.invariants) ||
      !Array.isArray(parsed.trust_boundaries)
    ) {
      return null;
    }

    return {
      description: parsed.description,
      goals: parsed.goals as string[],
      non_goals: parsed.non_goals as string[],
      invariants: parsed.invariants as string[],
      trust_boundaries: parsed.trust_boundaries as string[],
    };
  } catch {
    return null;
  }
}
