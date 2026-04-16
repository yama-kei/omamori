import type { SoftwareGraph } from "../detectors/types.js";
import type { CheckResult, HealthReport, ManifestData } from "./types.js";
import { checkDependencies } from "./dependencies.js";
import { checkEndpoints } from "./endpoints.js";
import { checkApiCompatibility } from "./api-compatibility.js";
import { checkSecurity } from "./security.js";
import { checkCost } from "./cost.js";
import { checkIntent } from "./intent.js";

function parseThresholdMs(threshold: string | undefined): number {
  if (!threshold) return 2000;
  const match = /^(\d+(?:\.\d+)?)\s*(ms|s)$/i.exec(threshold);
  if (!match) return 2000;
  const value = parseFloat(match[1]);
  return match[2].toLowerCase() === "s" ? value * 1000 : value;
}

function getDeployedUrl(_manifest: ManifestData): string | null {
  // omamori.yaml doesn't currently store a deployed URL at top level,
  // but could be added. For now return null.
  return null;
}

export async function runChecks(
  projectDir: string,
  manifest: ManifestData,
  graph: SoftwareGraph,
): Promise<HealthReport> {
  const thresholdMs = parseThresholdMs(
    manifest.health_thresholds?.response_time_p95,
  );
  const deployedUrl = getDeployedUrl(manifest);

  const checks: CheckResult[] = await Promise.all([
    checkDependencies(graph.dependencies),
    checkEndpoints(deployedUrl, thresholdMs),
    checkApiCompatibility(graph.externalApis),
    checkSecurity(projectDir),
    Promise.resolve(checkCost(manifest)),
    checkIntent(projectDir, manifest, graph.files),
  ]);

  const scored = checks.filter((c) => !c.skipped);
  const overallScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, c) => sum + c.score, 0) / scored.length,
        )
      : 0;

  return {
    projectName: manifest.name,
    overallScore,
    checks,
  };
}
