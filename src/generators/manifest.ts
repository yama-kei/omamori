import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { stringify as yamlStringify } from "yaml";
import type { DetectionResult, IntentResult } from "../detectors/types.js";

function detectRepo(projectDir: string): string | null {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    // Convert GitHub URLs to github:user/repo format
    // Handle https://github.com/user/repo and git@github.com:user/repo
    const httpsMatch = /https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/.exec(remoteUrl);
    if (httpsMatch) {
      return `github:${httpsMatch[1]}`;
    }

    const sshMatch = /git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/.exec(remoteUrl);
    if (sshMatch) {
      return `github:${sshMatch[1]}`;
    }

    // Return raw remote URL for non-GitHub remotes
    return remoteUrl;
  } catch {
    return null;
  }
}

export function generateManifest(
  projectDir: string,
  projectName: string,
  detection: DetectionResult,
  intent: IntentResult | null,
): void {
  const repo = detectRepo(projectDir);

  const resolvedIntent = intent ?? {
    description: "TODO: Add project description",
    goals: ["TODO: Add project goals"],
    non_goals: ["TODO: Add non-goals"],
    invariants: ["TODO: Add invariants"],
    trust_boundaries: ["TODO: Add trust boundaries"],
  };

  const manifest = {
    name: projectName,
    url: detection.url.url,
    intent: {
      description: resolvedIntent.description,
      goals: resolvedIntent.goals,
      non_goals: resolvedIntent.non_goals,
      invariants: resolvedIntent.invariants,
      trust_boundaries: resolvedIntent.trust_boundaries,
    },
    infrastructure: {
      framework: detection.framework.framework,
      hosting: detection.hosting.hosting,
      database: detection.database.database,
      auth: detection.auth.auth,
      repo,
    },
    cost_budget: {
      monthly_max: null,
      alert_at: null,
    },
    health_thresholds: {
      dependency_staleness: "90 days",
      uptime: "99%",
      response_time_p95: "2s",
    },
  };

  const yamlContent = yamlStringify(manifest);
  writeFileSync(join(projectDir, "omamori.yaml"), yamlContent);
}
