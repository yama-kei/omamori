import type { CheckResult } from "./types.js";

export async function checkEndpoints(
  url: string | null | undefined,
  thresholdMs: number = 2000,
): Promise<CheckResult> {
  if (!url) {
    return {
      dimension: "Endpoints",
      score: 0,
      label: "Endpoints",
      details: "no deployed URL configured",
      recommendations: [],
      skipped: true,
    };
  }

  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
    const elapsed = Date.now() - start;

    const statusOk = res.status >= 200 && res.status < 400;
    let score = statusOk ? 100 : 30;

    if (statusOk && elapsed > thresholdMs) {
      score -= 15;
    }

    const details = statusOk
      ? `responding (${elapsed}ms)`
      : `returned HTTP ${res.status}`;

    const recommendations: string[] = [];
    if (!statusOk) {
      recommendations.push(`Deployed URL returned HTTP ${res.status} — investigate`);
    }
    if (statusOk && elapsed > thresholdMs) {
      recommendations.push(
        `Response time ${elapsed}ms exceeds ${thresholdMs}ms threshold`,
      );
    }

    return {
      dimension: "Endpoints",
      score,
      label: "Endpoints",
      details,
      recommendations,
      skipped: false,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "unknown error";
    return {
      dimension: "Endpoints",
      score: 0,
      label: "Endpoints",
      details: `unreachable (${message})`,
      recommendations: [`Deployed URL ${url} is unreachable — check DNS and hosting`],
      skipped: false,
    };
  }
}
