import { getReadmeNpm, searchNpm } from "./npm.ts";
import { getReadmeJsr, searchJsr } from "./jsr.ts";
import { getReadmeCrates, searchCrates } from "./crates.ts";
import type { PackageResult } from "./types.ts";

export type Registry = "npm" | "jsr" | "crates";

interface RegistryConfig {
  label: string;
  search: (query: string) => Promise<PackageResult | null>;
  getReadme: (query: string) => Promise<string | null>;
  isHtml: boolean; // true if readme is already HTML (crates.io)
}

export const registryConfigs: Record<Registry, RegistryConfig> = {
  npm: {
    label: "npm",
    search: searchNpm,
    getReadme: getReadmeNpm,
    isHtml: false,
  },
  jsr: {
    label: "JSR",
    search: searchJsr,
    getReadme: getReadmeJsr,
    isHtml: false,
  },
  crates: {
    label: "crates.io",
    search: searchCrates,
    getReadme: getReadmeCrates,
    isHtml: true,
  },
};

export function getRegistryConfig(registry: string): RegistryConfig | null {
  if (registry === "npm" || registry === "jsr" || registry === "crates") {
    return registryConfigs[registry];
  }
  return null;
}
