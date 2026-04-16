import type { DetectionResult } from "./types.js";
import { detectFramework } from "./framework.js";
import { detectHosting } from "./hosting.js";
import { detectDatabase } from "./database.js";
import { detectApis } from "./apis.js";
import { detectAuth } from "./auth.js";
import { detectEnvVars } from "./env.js";
import { detectUrl } from "./url.js";

export { type DetectionResult } from "./types.js";

export function runDetectors(projectDir: string): DetectionResult {
  return {
    framework: detectFramework(projectDir),
    hosting: detectHosting(projectDir),
    database: detectDatabase(projectDir),
    apis: detectApis(projectDir),
    auth: detectAuth(projectDir),
    env: detectEnvVars(projectDir),
    url: detectUrl(projectDir),
  };
}
