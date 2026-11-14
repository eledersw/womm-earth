"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { shellCopy } from "@/lib/copy/globe";

// The whole case lives in the URL, so sharing is copying the address.
export function ShareButton() {
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(shellCopy.shareCopied);
    } catch {
      toast.error(shellCopy.shareFailed);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={shellCopy.share}
      className="label-nav glass-pill inline-flex h-10 items-center gap-2 rounded-full px-4 whitespace-nowrap text-ink transition-[transform,background-color] duration-150 ease-out hover:bg-well-2 active:scale-[0.98]"
    >
      <Link2 aria-hidden className="size-4" strokeWidth={1.75} />
      <span aria-hidden>{shellCopy.shareShort}</span>
      <span aria-hidden className="hidden sm:inline">{shellCopy.shareRest}</span>
    </button>
  );
}
