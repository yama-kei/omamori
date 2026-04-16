import type { CheckResult, HealthReport } from "../checks/types.js";

function scoreIcon(result: CheckResult): string {
  if (result.skipped) return "⊘";
  if (result.score >= 80) return "✓";
  if (result.score >= 50) return "⚠";
  return "✗";
}

function scoreDisplay(result: CheckResult): string {
  if (result.skipped) return "skipped";
  return `${result.score}/100`;
}

export function formatHealthReport(report: HealthReport): string {
  const lines: string[] = [];

  lines.push(
    `🏥 ${report.projectName} — Health: ${report.overallScore}/100`,
  );
  lines.push("");

  for (const check of report.checks) {
    const icon = scoreIcon(check);
    const score = scoreDisplay(check);
    const label = check.label.padEnd(18);
    lines.push(`  ${label}${icon} ${score}  — ${check.details}`);
  }

  const allRecommendations = report.checks.flatMap((c) => c.recommendations);

  if (allRecommendations.length > 0) {
    lines.push("");
    lines.push("  Recommended actions:");
    for (let i = 0; i < allRecommendations.length; i++) {
      lines.push(`  ${i + 1}. ${allRecommendations[i]}`);
    }
  }

  return lines.join("\n");
}
