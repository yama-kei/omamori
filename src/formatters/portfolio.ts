import type { HealthReport } from "../checks/types.js";

export interface ProjectStatus {
  name: string;
  path: string;
  report: HealthReport | null;
  error: string | null;
}

function scoreIcon(score: number): string {
  if (score >= 80) return "✓";
  if (score >= 50) return "⚠";
  return "✗";
}

function topIssue(report: HealthReport): string {
  const scored = report.checks
    .filter((c) => !c.skipped)
    .sort((a, b) => a.score - b.score);

  if (scored.length === 0) return "no checks ran";

  const allHealthy = scored.every((c) => c.score >= 80);
  if (allHealthy) return "healthy";

  const worst = scored[0];
  return worst.details;
}

export function formatPortfolio(projects: ProjectStatus[]): string {
  if (projects.length === 0) {
    return "No projects onboarded yet. Run 'omamori init' in a project directory.";
  }

  const lines: string[] = [];
  lines.push("📋 Portfolio Health");
  lines.push("");

  const maxNameLen = Math.max(...projects.map((p) => p.name.length), 10);

  for (const project of projects) {
    const name = project.name.padEnd(maxNameLen);

    if (project.error) {
      lines.push(`  ${name}  ✗ ${project.error}`);
      continue;
    }

    if (!project.report) {
      lines.push(`  ${name}  ✗ check failed`);
      continue;
    }

    const score = project.report.overallScore;
    const icon = scoreIcon(score);
    const issue = topIssue(project.report);
    lines.push(`  ${name}  ${score}/100  ${icon} ${issue}`);
  }

  lines.push("");
  const count = projects.length;
  lines.push(`${count} project${count !== 1 ? "s" : ""} tracked`);

  return lines.join("\n");
}
