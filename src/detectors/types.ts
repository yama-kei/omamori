export interface FrameworkResult {
  framework: string | null;
  version: string | null;
}

export interface HostingResult {
  hosting: string | null;
}

export interface DatabaseResult {
  database: string | null;
}

export interface ApisResult {
  apis: string[];
}

export interface AuthResult {
  auth: string | null;
}

export interface EnvResult {
  envVars: string[];
}

export interface UrlResult {
  url: string | null;
}

export interface DetectionResult {
  framework: FrameworkResult;
  hosting: HostingResult;
  database: DatabaseResult;
  apis: ApisResult;
  auth: AuthResult;
  env: EnvResult;
  url: UrlResult;
}

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  homepage?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface GraphFile {
  path: string;
  role: string;
}

export interface GraphDependency {
  name: string;
  version: string;
  type: "production" | "development";
}

export interface GraphApi {
  name: string;
  sdkPackage: string;
  version: string;
}

export interface SoftwareGraph {
  files: GraphFile[];
  dependencies: GraphDependency[];
  externalApis: GraphApi[];
  envVars: string[];
  infrastructure: {
    framework: string | null;
    hosting: string | null;
    database: string | null;
    auth: string | null;
  };
}

export interface PortfolioEntry {
  name: string;
  path: string;
  onboardedAt: string;
}

export interface IntentResult {
  description: string;
  goals: string[];
  non_goals: string[];
  invariants: string[];
  trust_boundaries: string[];
}
