import { define } from "../../../utils.ts";
import { searchNpm } from "../../../lib/npm.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const query = ctx.url.searchParams.get("q");

    if (!query || query.trim() === "") {
      return Response.json({ error: "Query parameter 'q' is required" }, {
        status: 400,
      });
    }

    const result = await searchNpm(query);

    return Response.json({
      query,
      result,
    });
  },
});
