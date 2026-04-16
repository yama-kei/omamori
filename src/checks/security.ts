import { execSync } from "node:child_process";
import type { CheckResult } from "./types.js";

interface AuditAdvisory {
  severity: string;
}

interface NpmAuditV2 {
  vulnerabilities?: Record<
    string,
    { severity: string; via: unknown[] }
  >;
}

export interface VulnerabilityCounts {
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

export function parseAuditOutput(output: string): VulnerabilityCounts {
  const counts: VulnerabilityCounts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  };

  try {
    const data = JSON.parse(output) as
      | NpmAuditV2
      | { advisories?: Record<string, AuditAdvisory> };

    // npm audit v2 format (npm 7+)
    if ("vulnerabilities" in data && data.vulnerabilities) {
      for (const vuln of Object.values(data.vulnerabilities)) {
        const sev = vuln.severity as keyof VulnerabilityCounts;
        if (sev in counts) counts[sev]++;
      }
      return counts;
    }

    // npm audit v1 format
    if ("advisories" in data && data.advisories) {
      for (const adv of Object.values(data.advisories)) {
        const sev = adv.severity as keyof VulnerabilityCounts;
        if (sev in counts) counts[sev]++;
      }
      return counts;
    }
  } catch {
    // parse failure — return zeroes
  }

  return counts;
}

export function computeSecurityScore(counts: VulnerabilityCounts): number {
  const penalty =
    counts.critical * 25 +
    counts.high * 15 +
    counts.moderate * 5 +
    counts.low * 1;
  return Math.max(100 - penalty, 0);
}

export async function checkSecurity(
  projectDir: string,
): Promise<CheckResult> {
  let auditOutput: string;

  try {
    auditOutput = execSync("npm audit --json", {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
    });
  } catch (err) {
    // npm audit exits non-zero when vulns found — capture stdout
    if (
      err &&
      typeof err === "object" &&
      "stdout" in err &&
      typeof (err as { stdout: unknown }).stdout === "string"
    ) {
      auditOutput = (err as { stdout: string }).stdout;
    } else {
      return {
        dimension: "Security",
        score: 100,
        label: "Security",
        details: "npm audit unavailable",
        recommendations: [],
        skipped: true,
      };
    }
  }

  const counts = parseAuditOutput(auditOutput);
  const total = counts.critical + counts.high + counts.moderate + counts.low;
  const score = computeSecurityScore(counts);

  let details: string;
  if (total === 0) {
    details = "no known vulnerabilities";
  } else {
    const parts: string[] = [];
    if (counts.critical > 0) parts.push(`${counts.critical} critical`);
    if (counts.high > 0) parts.push(`${counts.high} high`);
    if (counts.moderate > 0) parts.push(`${counts.moderate} moderate`);
    if (counts.low > 0) parts.push(`${counts.low} low`);
    details = `${total} vulnerabilit${total > 1 ? "ies" : "y"} (${parts.join(", ")})`;
  }

  const recommendations: string[] = [];
  if (counts.critical > 0) {
    recommendations.push(`Fix ${counts.critical} critical vulnerabilit${counts.critical > 1 ? "ies" : "y"} immediately`);
  }
  if (counts.high > 0) {
    recommendations.push(`Address ${counts.high} high-severity vulnerabilit${counts.high > 1 ? "ies" : "y"}`);
  }

  return {
    dimension: "Security",
    score,
    label: "Security",
    details,
    recommendations,
    skipped: false,
  };
}
