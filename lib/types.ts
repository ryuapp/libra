export interface PackageResult {
  source: "npm" | "jsr" | "crates";
  name: string;
  version?: string;
  description: string;
  url: string;
  author?: string;
  github?: string;
}
