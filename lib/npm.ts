import * as v from "valibot";
import { httpClient } from "./http-client.ts";
import type { PackageResult } from "./types.ts";

// npm package name schema
// Rules: lowercase only, 1-214 chars, cannot start with . or _, URL-friendly characters
// Can be scoped (@scope/name) or non-scoped
const NpmPackageNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Package name is required"),
  v.minLength(1, "Package name must be at least 1 character"),
  v.maxLength(214, "Package name must be 214 characters or less"),
  v.regex(
    /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/,
    "Invalid npm package name: must be lowercase, cannot start with . or _, no special characters",
  ),
  v.check(
    (name) => !name.includes("~)'(!*") && !/\s/.test(name),
    "Package name cannot contain special characters or spaces",
  ),
);

interface NpmPackageInfo {
  name: string;
  version: string;
  description?: string;
  readme?: string;
  maintainers?: Array<{
    name: string;
  }>;
  repository?: {
    type: string;
    url: string;
  };
}

export async function searchNpm(
  query: string,
  options?: { cacheOnly?: boolean },
): Promise<PackageResult | null> {
  // Validate query with valibot
  const parseResult = v.safeParse(NpmPackageNameSchema, query);
  if (!parseResult.success) {
    return null;
  }

  const validQuery = parseResult.output;
  const cacheKey = `https://cache.libra.internal/npm/${
    encodeURIComponent(validQuery)
  }`;
  const cache = await caches.open("npm");

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

    // Fetch from npm registry (latest version only)
    let data: NpmPackageInfo;
    try {
      data = await httpClient(
        `https://registry.npmjs.org/${encodeURIComponent(validQuery)}/latest`,
      ).json<NpmPackageInfo>();
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

    // Extract GitHub URL from repository
    let github: string | undefined;
    if (data.repository?.url) {
      const match = data.repository.url.match(
        /github\.com[\/:]([^\/]+\/[^\/\.]+)/,
      );
      if (match) {
        github = `https://github.com/${match[1]}`;
      }
    }

    const result: PackageResult = {
      source: "npm" as const,
      name: data.name,
      version: data.version,
      description: data.description || "",
      url: `https://www.npmjs.com/package/${data.name}`,
      author: data.maintainers?.[0]?.name,
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
    console.error("NPM package fetch error:", error);
    return null;
  }
}

export async function getReadmeNpm(
  query: string,
): Promise<string | null> {
  // Validate query with valibot
  const parseResult = v.safeParse(NpmPackageNameSchema, query);
  if (!parseResult.success) {
    return null;
  }

  const validQuery = parseResult.output;
  const cacheKey = `https://cache.libra.internal/npm/readme/${
    encodeURIComponent(validQuery)
  }`;
  const cache = await caches.open("npm");

  try {
    // Check cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return await cachedResponse.text();
    }

    // Fetch README.md from esm.sh
    const readmeUrl = `https://esm.sh/${
      encodeURIComponent(validQuery)
    }/README.md`;

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
  } catch (error) {
    console.error("NPM readme fetch error:", error);
    return null;
  }
}
