export interface CheckResult {
  dimension: string;
  score: number;
  label: string;
  details: string;
  recommendations: string[];
  skipped: boolean;
}

export interface HealthReport {
  projectName: string;
  overallScore: number;
  checks: CheckResult[];
}

export interface ManifestData {
  name: string;
  description?: string;
  goals?: string[];
  non_goals?: string[];
  invariants?: string[];
  trust_boundaries?: string[];
  infrastructure?: {
    repo?: string | null;
    hosting?: string | null;
    database?: string | null;
    apis?: string[];
  };
  cost_budget?: {
    monthly_max?: string | number | null;
    alert_at?: string | number | null;
  };
  health_thresholds?: {
    dependency_staleness?: string;
    uptime?: string;
    response_time_p95?: string;
  };
}
