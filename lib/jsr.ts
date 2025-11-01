import * as v from "valibot";
import { httpClient } from "./http-client.ts";
import type { PackageResult } from "./types.ts";

// JSR package name schema: @scope/name or scope/name format
// Package names: 2-58 characters, lowercase letters, numbers, hyphens (cannot start with hyphen)
const JsrPackageNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Package name is required"),
  v.regex(
    /^(@?[a-z0-9][a-z0-9-]{0,56}[a-z0-9]\/[a-z0-9][a-z0-9-]{0,56}[a-z0-9])$/,
    "Invalid JSR package name format (expected: @scope/name or scope/name, 2-58 chars each)",
  ),
);

interface JsrPackageInfo {
  scope: string;
  name: string;
  description: string;
  latestVersion: string;
  githubRepository?: {
    owner: string;
    name: string;
  };
}

export async function searchJsr(
  query: string,
  options?: { cacheOnly?: boolean },
): Promise<PackageResult | null> {
  // Validate query with valibot
  const parseResult = v.safeParse(JsrPackageNameSchema, query);
  if (!parseResult.success) {
    return null;
  }

  const validQuery = parseResult.output;
  const cacheKey = `https://cache.libra.internal/jsr/${
    encodeURIComponent(validQuery)
  }`;
  const cache = await caches.open("jsr");

  try {
    // Check cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const cached = await cachedResponse.json() as {
        result: PackageResult | null;
      };
      return cached.result;
    }

    // If cacheOnly is set, return null if not in cache
    if (options?.cacheOnly) {
      return null;
    }

    // Parse query - supports both @scope/name and scope/name formats
    let scope: string;
    let name: string;

    if (validQuery.startsWith("@")) {
      const parts = validQuery.slice(1).split("/");
      scope = parts[0];
      name = parts[1];
    } else {
      const parts = validQuery.split("/");
      scope = parts[0];
      name = parts[1];
    }

    let data: JsrPackageInfo;
    try {
      data = await httpClient(
        `https://jsr.io/api/scopes/${encodeURIComponent(scope)}/packages/${
          encodeURIComponent(name)
        }`,
      ).json<JsrPackageInfo>();
    } catch (_error) {
      // Cache not found result for 24 hours
      const notFoundResponse = new Response(
        JSON.stringify({ result: null }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=86400", // 24 hours
          },
        },
      );
      await cache.put(cacheKey, notFoundResponse.clone());
      return null;
    }

    // Extract GitHub URL
    let github: string | undefined;
    if (data.githubRepository) {
      github =
        `https://github.com/${data.githubRepository.owner}/${data.githubRepository.name}`;
    }

    const result: PackageResult = {
      source: "jsr" as const,
      name: `@${data.scope}/${data.name}`,
      version: data.latestVersion,
      description: data.description || "",
      url: `https://jsr.io/@${data.scope}/${data.name}`,
      github,
    };

    // Cache successful result for 1 hour
    const successResponse = new Response(
      JSON.stringify({ result }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=3600", // 1 hour
        },
      },
    );
    await cache.put(cacheKey, successResponse.clone());

    return result;
  } catch (error) {
    console.error("JSR package fetch error:", error);
    return null;
  }
}

export async function getReadmeJsr(
  query: string,
): Promise<string | null> {
  // Validate query with valibot
  const parseResult = v.safeParse(JsrPackageNameSchema, query);
  if (!parseResult.success) {
    return null;
  }

  const validQuery = parseResult.output;
  const cacheKey = `https://cache.libra.internal/jsr/readme/${
    encodeURIComponent(validQuery)
  }`;
  const cache = await caches.open("jsr");

  try {
    // Check cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return await cachedResponse.text();
    }

    // Parse query - supports both @scope/name and scope/name formats
    let scope: string;
    let name: string;

    if (validQuery.startsWith("@")) {
      const parts = validQuery.slice(1).split("/");
      scope = parts[0];
      name = parts[1];
    } else {
      const parts = validQuery.split("/");
      scope = parts[0];
      name = parts[1];
    }

    // Fetch README.md from esm.sh which provides JSR package contents
    const readmeUrl = `https://esm.sh/jsr/@${scope}/${name}/README.md`;

    try {
      const readme = await httpClient(readmeUrl).text();

      // Cache successful result for 1 hour
      const successResponse = new Response(readme, {
        headers: {
          "Content-Type": "text/markdown",
          "Cache-Control": "public, s-maxage=3600", // 1 hour
        },
      });
      await cache.put(cacheKey, successResponse.clone());

      return readme;
    } catch (_error) {
      // Cache not found result for 24 hours
      const notFoundResponse = new Response("", {
        status: 404,
        headers: {
          "Cache-Control": "public, s-maxage=86400", // 24 hours
        },
      });
      await cache.put(cacheKey, notFoundResponse.clone());

      return null;
    }
  } catch (_error) {
    console.error("JSR readme fetch error:", _error);
    return null;
  }
}
