import { Head } from "fresh/runtime";
import { page } from "fresh";
import { define } from "../utils.ts";
import { performSSRSearch } from "../lib/search.ts";
import type { PackageResult } from "../lib/types.ts";
import SearchBar from "../islands/search-bar.tsx";
import SearchResults from "../islands/search-results.tsx";

interface SearchPageData {
  query: string;
  results: PackageResult[];
}

export const handler = define.handlers({
  async GET(ctx) {
    const query = ctx.url.searchParams.get("q") || "";
    const results = await performSSRSearch(query);
    return page<SearchPageData>({ query, results });
  },
});

export default define.page<typeof handler>(({ data }) => {
  return (
    <div class="min-h-screen px-6 py-12">
      <Head>
        <title>{data.query ? `${data.query} - Libra` : "Libra"}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div class="mx-auto max-w-3xl">
        <div class="mb-8">
          <a
            href="/"
            class="inline-block font-bold text-2xl text-white transition-opacity hover:opacity-80"
          >
            Libra
          </a>
        </div>

        <div class="mb-12">
          <SearchBar initialQuery={data.query} />
        </div>

        <SearchResults query={data.query} initialResults={data.results} />
      </div>
    </div>
  );
});
