import type { GraphDependency } from "../detectors/types.js";
import type { CheckResult } from "./types.js";
import { lt, valid, coerce } from "semver";

interface NpmRegistryResponse {
  version: string;
  time?: string;
}

async function fetchLatestVersion(
  packageName: string,
): Promise<NpmRegistryResponse | null> {
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
    );
    if (!res.ok) return null;
    return (await res.json()) as NpmRegistryResponse;
  } catch {
    return null;
  }
}

export interface StaleDep {
  name: string;
  installed: string;
  latest: string;
}

export async function checkDependencies(
  dependencies: GraphDependency[],
): Promise<CheckResult> {
  const prodDeps = dependencies.filter((d) => d.type === "production");

  if (prodDeps.length === 0) {
    return {
      dimension: "Dependencies",
      score: 100,
      label: "Dependencies",
      details: "no production dependencies",
      recommendations: [],
      skipped: false,
    };
  }

  const staleDeps: StaleDep[] = [];
  const checkedCount = Math.min(prodDeps.length, 20); // limit registry calls

  for (const dep of prodDeps.slice(0, checkedCount)) {
    const latest = await fetchLatestVersion(dep.name);
    if (!latest) continue;

    const installedVer = valid(coerce(dep.version));
    const latestVer = valid(coerce(latest.version));

    if (installedVer && latestVer && lt(installedVer, latestVer)) {
      staleDeps.push({
        name: dep.name,
        installed: dep.version,
        latest: latest.version,
      });
    }
  }

  const penalty = Math.min(staleDeps.length * 8, 60);
  const score = Math.max(100 - penalty, 0);

  const details =
    staleDeps.length === 0
      ? "all dependencies up to date"
      : `${staleDeps.length} package${staleDeps.length > 1 ? "s" : ""} behind latest`;

  const recommendations = staleDeps.map(
    (d) => `Update ${d.name} ${d.installed} → ${d.latest}`,
  );

  return {
    dimension: "Dependencies",
    score,
    label: "Dependencies",
    details,
    recommendations,
    skipped: false,
  };
}
