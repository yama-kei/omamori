import type { CheckResult, ManifestData } from "./types.js";

const HOSTING_COST_NOTES: Record<string, string> = {
  vercel: "Vercel hobby plan has bandwidth and serverless limits",
  netlify: "Netlify free tier has 100GB bandwidth/month limit",
  "cloudflare-workers": "Cloudflare Workers free tier: 100K requests/day",
};

const DATABASE_COST_NOTES: Record<string, string> = {
  supabase: "Supabase free tier: 500MB storage, 2GB bandwidth",
  firebase: "Firebase Spark plan has limited reads/writes/storage",
  planetscale: "PlanetScale hobby: 5GB storage, 1B row reads",
};

export function checkCost(manifest: ManifestData): CheckResult {
  const budget = manifest.cost_budget;
  const hasBudget =
    budget && (budget.monthly_max !== null && budget.monthly_max !== undefined);

  if (!hasBudget) {
    return {
      dimension: "Cost",
      score: 0,
      label: "Cost",
      details: "no budget configured",
      recommendations: ["Set cost_budget.monthly_max in omamori.yaml to enable cost tracking"],
      skipped: true,
    };
  }

  const hosting = manifest.infrastructure?.hosting ?? null;
  const database = manifest.infrastructure?.database ?? null;

  const concerns: string[] = [];
  const recommendations: string[] = [];

  if (hosting && hosting in HOSTING_COST_NOTES) {
    concerns.push(HOSTING_COST_NOTES[hosting]);
  }
  if (database && database in DATABASE_COST_NOTES) {
    concerns.push(DATABASE_COST_NOTES[database]);
  }

  const apiCount = manifest.infrastructure?.apis?.length ?? 0;
  if (apiCount > 2) {
    concerns.push(`${apiCount} external APIs may have usage-based costs`);
  }

  if (concerns.length > 0) {
    recommendations.push(
      ...concerns.map((c) => `Review: ${c}`),
    );
  }

  const penalty = Math.min(concerns.length * 5, 20);
  const score = 100 - penalty;

  const budgetStr = String(budget!.monthly_max);
  const details =
    concerns.length === 0
      ? `within ${budgetStr} budget`
      : `${concerns.length} potential cost concern${concerns.length > 1 ? "s" : ""} for ${budgetStr} budget`;

  return {
    dimension: "Cost",
    score,
    label: "Cost",
    details,
    recommendations,
    skipped: false,
  };
}
