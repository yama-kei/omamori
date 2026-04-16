import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ApisResult, PackageJson } from "./types.js";

const API_MAP: [string, string][] = [
  ["stripe", "stripe"],
  ["openai", "openai"],
  ["@anthropic-ai/sdk", "anthropic"],
  ["@sendgrid/mail", "sendgrid"],
  ["twilio", "twilio"],
  ["@aws-sdk/client-s3", "aws-s3"],
  ["@aws-sdk/client-ses", "aws-ses"],
  ["resend", "resend"],
  ["postmark", "postmark"],
  ["@slack/web-api", "slack"],
  ["discord.js", "discord"],
];

export function detectApis(projectDir: string): ApisResult {
  let pkg: PackageJson;
  try {
    const content = readFileSync(join(projectDir, "package.json"), "utf-8");
    pkg = JSON.parse(content) as PackageJson;
  } catch {
    return { apis: [] };
  }

  const allDeps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };

  const apis: string[] = [];
  for (const [dep, api] of API_MAP) {
    if (dep in allDeps) {
      apis.push(api);
    }
  }

  return { apis };
}
