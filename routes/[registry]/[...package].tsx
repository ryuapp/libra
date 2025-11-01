import { Head } from "fresh/runtime";
import { page } from "fresh";
import { define } from "../../utils.ts";
import MarkdownIt from "markdown-it";
import CopyButton from "../../islands/copy-button.tsx";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  getRegistryConfig,
  type Registry,
  registryConfigs,
} from "../../lib/registry-config.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const registry = ctx.params.registry;
    const packageParam = ctx.params.package;

    // packageParam can be a string or array depending on Fresh version
    const packageName = Array.isArray(packageParam)
      ? packageParam.join("/")
      : packageParam;

    if (!registry) {
      return new Response("Not Found Registry", { status: 404 });
    }

    if (!packageName) {
      return new Response("Not Found Package", { status: 404 });
    }

    const config = getRegistryConfig(registry as string);
    if (!config) {
      return new Response("Not Found Config", {
        status: 404,
      });
    }

    try {
      const [pkgData, readme] = await Promise.all([
        config.search(packageName),
        config.getReadme(packageName),
      ]);

      if (!pkgData) {
        return new Response("Not Found package data", {
          status: 404,
        });
      }

      return page({ registry: registry as Registry, package: pkgData, readme });
    } catch (error) {
      console.error("Error in handler:", error);
      return new Response(`Internal Server Error: ${error}`, {
        status: 500,
      });
    }
  },
});

export default define.page<typeof handler>(({ data }) => {
  const { registry, package: pkg, readme } = data;
  const config = registryConfigs[registry];

  // Render markdown to HTML if needed (not for crates.io which returns HTML)
  let renderedHtml = "";
  if (readme) {
    if (config.isHtml) {
      renderedHtml = readme;
    } else {
      const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
      });
      renderedHtml = md.render(readme);
    }
  }

  // Badge styling based on registry
  const getBadgeClasses = () => {
    switch (registry) {
      case "npm":
        return "bg-npm-bg text-npm-text";
      case "jsr":
        return "bg-jsr-bg text-jsr-text";
      case "crates":
        return "bg-crates-bg text-crates-text";
      default:
        return "bg-gray-800 text-gray-300";
    }
  };

  return (
    <div class="min-h-screen bg-black px-6 py-12">
      <Head>
        <title>{pkg.name} - Libra</title>
        <meta name="description" content={pkg.description} />
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

        <div class="mb-8 rounded-lg border border-gray-800 bg-gray-900 p-6">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 class="font-bold text-3xl text-white">{pkg.name}</h1>
              <p class="mt-2 text-gray-400">{pkg.description}</p>
            </div>
            {pkg.version && <CopyButton text={pkg.version} />}
          </div>

          <div class="mt-6 flex gap-3">
            <a
              href={pkg.url}
              target="_blank"
              rel="noopener noreferrer"
              class={`rounded px-4 py-2 hover:opacity-80 ${getBadgeClasses()}`}
            >
              {registry === "crates" ? "crates.io" : registry}
            </a>
            {pkg.github && (
              <a
                href={pkg.github}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 rounded bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700"
              >
                <GitHubLogoIcon class="size-4" />
                {pkg.github.replace("https://github.com/", "")}
              </a>
            )}
          </div>
        </div>

        {readme
          ? (
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
              <div
                class="markdown"
                // deno-lint-ignore react-no-danger
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          )
          : (
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
              <p class="text-gray-400">No README available</p>
            </div>
          )}
      </div>
    </div>
  );
});
