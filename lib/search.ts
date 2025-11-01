import { searchNpm } from "./npm.ts";
import { searchJsr } from "./jsr.ts";
import { searchCrates } from "./crates.ts";
import type { PackageResult } from "./types.ts";

/**
 * Performs a unified search across all registries for SSR
 * Uses cache only to provide instant results without network requests
 */
export async function performSSRSearch(
  query: string,
): Promise<PackageResult[]> {
  if (!query.trim()) {
    return [];
  }

  const results = await Promise.allSettled([
    searchNpm(query, { cacheOnly: true }),
    searchJsr(query, { cacheOnly: true }),
    searchCrates(query, { cacheOnly: true }),
  ]);

  return results
    .map((result) => result.status === "fulfilled" ? result.value : null)
    .filter((result): result is PackageResult => result !== null);
}
