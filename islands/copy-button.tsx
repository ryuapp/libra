import { useSignal } from "@preact/signals";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const copied = useSignal(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-400 text-xs transition-colors hover:bg-gray-700 hover:text-gray-300"
      title="Copy version"
    >
      {copied.value
        ? (
          <span class="flex items-center gap-1">
            <CheckIcon class="size-3" />
            Copied!
          </span>
        )
        : (
          <span class="flex items-center gap-1">
            {text}
            <CopyIcon class="size-3" />
          </span>
        )}
    </button>
  );
}
