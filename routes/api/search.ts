import { define } from "../../utils.ts";
import { searchNpm } from "../../lib/npm.ts";
import { searchJsr } from "../../lib/jsr.ts";
import { searchCrates } from "../../lib/crates.ts";
import type { PackageResult } from "../../lib/types.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const query = ctx.url.searchParams.get("q");

    if (!query || query.trim() === "") {
      return Response.json({ error: "Query parameter 'q' is required" }, {
        status: 400,
      });
    }

    const [npmResult, jsrResult, cratesResult] = await Promise.allSettled([
      searchNpm(query),
      searchJsr(query),
      searchCrates(query),
    ]);

    const results: PackageResult[] = [
      npmResult.status === "fulfilled" ? npmResult.value : null,
      jsrResult.status === "fulfilled" ? jsrResult.value : null,
      cratesResult.status === "fulfilled" ? cratesResult.value : null,
    ].filter((r): r is PackageResult => r !== null);

    return Response.json({
      query,
      results,
      count: {
        npm: npmResult.status === "fulfilled" && npmResult.value ? 1 : 0,
        jsr: jsrResult.status === "fulfilled" && jsrResult.value ? 1 : 0,
        crates: cratesResult.status === "fulfilled" && cratesResult.value
          ? 1
          : 0,
        total: results.length,
      },
    });
  },
});
