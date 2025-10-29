import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import CopyButton from "./copy-button.tsx";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

interface PackageResult {
  source: "npm" | "jsr" | "crates";
  name: string;
  version?: string;
  description: string;
  url: string;
  author?: string;
  github?: string;
}

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const results = useSignal<PackageResult[]>([]);
  const loading = useSignal(true);

  useEffect(() => {
    if (!query.trim()) {
      loading.value = false;
      return;
    }

    results.value = [];
    loading.value = true;

    const fetchRegistry = async (
      registry: "npm" | "jsr" | "crates",
      url: string,
    ) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            results.value = [...results.value, data.result];
          }
        }
      } catch (error) {
        console.error(`${registry} search error:`, error);
      }
    };

    // Fetch all registries in parallel, add results as they come in
    Promise.all([
      fetchRegistry("npm", `/api/search/npm?q=${encodeURIComponent(query)}`),
      fetchRegistry("jsr", `/api/search/jsr?q=${encodeURIComponent(query)}`),
      fetchRegistry(
        "crates",
        `/api/search/crates?q=${encodeURIComponent(query)}`,
      ),
    ]).then(() => {
      loading.value = false;
    });
  }, [query]);

  if (!query.trim()) {
    return null;
  }

  if (loading.value && results.value.length === 0) {
    return (
      <div class="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <p class="text-gray-300">Searching...</p>
      </div>
    );
  }

  if (!loading.value && results.value.length === 0) {
    return (
      <div class="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <p class="text-gray-300">
          No exact matches found for "{query}"
        </p>
        <p class="mt-2 text-gray-500 text-sm">
          Try searching for the exact package name
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-3">
      {results.value.map((pkg) => (
        <div
          key={`${pkg.source}-${pkg.name}`}
          class="rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="flex gap-2 text-xs">
              {pkg.github && (
                <a
                  href={pkg.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1.5 rounded bg-gray-800 px-2.5 py-1 font-medium text-gray-300"
                  title="View on GitHub"
                >
                  <GitHubLogoIcon class="size-3.5" />
                  {pkg.github.replace("https://github.com/", "")}
                </a>
              )}
              <a
                href={pkg.url}
                target="_blank"
                rel="noopener noreferrer"
                class={`rounded px-2.5 py-1 font-medium ${
                  pkg.source === "npm"
                    ? "bg-red-500/10 text-red-400"
                    : pkg.source === "jsr"
                    ? "text-[#F0DB4F]"
                    : "text-[#8fbc8f]"
                }`}
                style={pkg.source === "jsr"
                  ? { backgroundColor: "rgba(240, 219, 79, 0.1)" }
                  : pkg.source === "crates"
                  ? { backgroundColor: "hsl(115, 31%, 20%)" }
                  : {}}
                title={`View on ${
                  pkg.source === "crates" ? "crates.io" : pkg.source
                }`}
              >
                {pkg.source === "crates" ? "crates.io" : pkg.source}
              </a>
            </div>
          </div>
          <div class="mb-3 flex items-center gap-3">
            <div class="font-semibold text-white text-xl">
              {pkg.name}
            </div>
            {pkg.version && <CopyButton text={pkg.version} />}
          </div>
          {pkg.description && (
            <p class="text-gray-400 text-sm">
              {pkg.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
