import type { GraphApi } from "../detectors/types.js";
import type { CheckResult } from "./types.js";
import { valid, coerce, major } from "semver";

async function fetchLatestVersion(
  packageName: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { version: string };
    return data.version;
  } catch {
    return null;
  }
}

export interface OutdatedApi {
  name: string;
  sdkPackage: string;
  installed: string;
  latest: string;
  majorBehind: boolean;
}

export async function checkApiCompatibility(
  externalApis: GraphApi[],
): Promise<CheckResult> {
  if (externalApis.length === 0) {
    return {
      dimension: "External APIs",
      score: 100,
      label: "External APIs",
      details: "no external API SDKs detected",
      recommendations: [],
      skipped: false,
    };
  }

  const outdated: OutdatedApi[] = [];

  for (const api of externalApis) {
    const latestVersion = await fetchLatestVersion(api.sdkPackage);
    if (!latestVersion) continue;

    const installed = valid(coerce(api.version));
    const latest = valid(coerce(latestVersion));

    if (!installed || !latest) continue;

    if (installed !== latest) {
      outdated.push({
        name: api.name,
        sdkPackage: api.sdkPackage,
        installed: api.version,
        latest: latestVersion,
        majorBehind: major(installed) < major(latest),
      });
    }
  }

  const majorBehindCount = outdated.filter((o) => o.majorBehind).length;
  const minorBehindCount = outdated.length - majorBehindCount;
  const penalty = majorBehindCount * 15 + minorBehindCount * 5;
  const score = Math.max(100 - penalty, 0);

  let details: string;
  if (outdated.length === 0) {
    details = "all API SDKs up to date";
  } else {
    const parts: string[] = [];
    if (majorBehindCount > 0) {
      parts.push(`${majorBehindCount} major update${majorBehindCount > 1 ? "s" : ""} available`);
    }
    if (minorBehindCount > 0) {
      parts.push(`${minorBehindCount} minor update${minorBehindCount > 1 ? "s" : ""} available`);
    }
    details = parts.join(", ");
  }

  const recommendations = outdated.map((o) => {
    const label = o.majorBehind ? "(approval recommended — major version)" : "(safe to update)";
    return `Update ${o.sdkPackage} ${o.installed} → ${o.latest} ${label}`;
  });

  return {
    dimension: "External APIs",
    score,
    label: "External APIs",
    details,
    recommendations,
    skipped: false,
  };
}
