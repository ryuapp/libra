import { define } from "../../../utils.ts";
import { searchCrates } from "../../../lib/crates.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const query = ctx.url.searchParams.get("q");

    if (!query || query.trim() === "") {
      return Response.json({ error: "Query parameter 'q' is required" }, {
        status: 400,
      });
    }

    const result = await searchCrates(query);

    return Response.json({
      query,
      result,
    });
  },
});
