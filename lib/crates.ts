import * as v from "valibot";
import { httpClient } from "./http-client.ts";
import type { PackageResult } from "./types.ts";

// crates.io package name schema: alphanumeric, hyphens, underscores
const CratesPackageNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Package name is required"),
  v.maxLength(64, "Package name must be 64 characters or less"),
  v.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Invalid crates.io package name format",
  ),
);

interface CrateInfo {
  crate: {
    name: string;
    max_version: string;
    description: string;
    repository?: string;
  };
}

export async function getReadmeCrates(
  query: string,
): Promise<string | null> {
  // Validate query with valibot
  const parseResult = v.safeParse(CratesPackageNameSchema, query);
  if (!parseResult.success) {
    return null;
  }

  const validQuery = parseResult.output;
  const cacheKey = `https://cache.libra.internal/crates/readme/${
    encodeURIComponent(validQuery)
  }`;
  const cache = await caches.open("crates");

  try {
    // Check cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return await cachedResponse.text();
    }

    // Get the crate info to find the version
    const data = await httpClient(
      `https://crates.io/api/v1/crates/${encodeURIComponent(validQuery)}`,
    ).json<CrateInfo>();

    const version = data.crate.max_version;

    // Fetch README from crates.io API
    const readmeUrl = `https://crates.io/api/v1/crates/${
      encodeURIComponent(validQuery)
    }/${version}/readme`;

    try {
      const readme = await httpClient(readmeUrl).text();

      // Cache successful result for 1 hour
      const successResponse = new Response(readme, {
        headers: {
          "Content-Type": "text/html",
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
    console.error("Crates.io readme fetch error:", _error);
    return null;
  }
}

export async function searchCrates(
  query: string,
): Promise<PackageResult | null> {
  // Validate query with valibot
  const parseResult = v.safeParse(CratesPackageNameSchema, query);
  if (!parseResult.success) {
    return null;
  }

  const validQuery = parseResult.output;
  const cacheKey = `https://cache.libra.internal/crates/${
    encodeURIComponent(validQuery)
  }`;
  const cache = await caches.open("crates");

  try {
    // Check cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const cached = await cachedResponse.json() as {
        result: PackageResult | null;
      };
      return cached.result;
    }

    let data: CrateInfo;
    try {
      data = await httpClient(
        `https://crates.io/api/v1/crates/${encodeURIComponent(validQuery)}`,
      ).json<CrateInfo>();
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

    // Extract GitHub URL if it's a GitHub repository
    let github: string | undefined;
    if (data.crate.repository?.includes("github.com")) {
      github = data.crate.repository;
    }

    const result: PackageResult = {
      source: "crates" as const,
      name: data.crate.name,
      version: data.crate.max_version,
      description: data.crate.description?.trim() || "",
      url: `https://crates.io/crates/${data.crate.name}`,
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
    console.error("Crates.io package fetch error:", error);
    return null;
  }
}
