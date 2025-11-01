import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

interface SearchBarProps {
  initialQuery?: string;
  isSearchPage?: boolean;
}

export default function SearchBar(
  { initialQuery = "", isSearchPage = false }: SearchBarProps,
) {
  const query = useSignal(initialQuery);

  useEffect(() => {
    query.value = initialQuery;
  }, [initialQuery]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (query.value.trim()) {
      globalThis.location.href = `/search?q=${encodeURIComponent(query.value)}`;
    }
  };

  const transitionName = isSearchPage ? "search-box-search" : "search-box";

  return (
    <form
      onSubmit={handleSubmit}
      class="w-full"
      style={{ viewTransitionName: transitionName }}
    >
      <div class="relative flex items-center rounded-lg border border-gray-700 p-2 transition-colors focus-within:border-gray-500 hover:border-gray-600">
        <MagnifyingGlassIcon class="mr-3 size-5 text-gray-500" />
        <input
          type="text"
          value={query.value}
          onInput={(e) => query.value = (e.target as HTMLInputElement).value}
          placeholder="Search for a package..."
          class="flex-1 bg-transparent text-base text-white placeholder-gray-500 outline-none"
          autocomplete="off"
        />
      </div>
    </form>
  );
}
