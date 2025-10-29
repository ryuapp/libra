import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import SearchBar from "../islands/search-bar.tsx";

export default define.page(() => {
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <Head>
        <title>Libra - Cross-platform package search</title>
        <link rel="canonical" href="https://libra.ryu.app" />
      </Head>
      <div class="w-full max-w-2xl">
        <div class="mb-12 text-center">
          <h1 class="mb-4 font-bold text-6xl text-white tracking-tight">
            Search pacakges
          </h1>
          <p class="text-gray-400 text-lg">
            npm | JSR | crates.io
          </p>
        </div>
        <SearchBar />
      </div>
    </div>
  );
});
