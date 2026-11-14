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
      className="scale-label inline-flex h-9 items-center gap-2 rounded-sm whitespace-nowrap border border-enamel-seam bg-enamel-2 px-3 text-enamel-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(0_0_0/0.35)] transition-[transform,box-shadow] duration-100 ease-out hover:bg-enamel hover:text-white active:translate-y-px active:shadow-[inset_0_2px_3px_rgb(0_0_0/0.4)] focus-visible:outline-signal-lamp"
    >
      <Link2 aria-hidden className="size-4" strokeWidth={2} />
      <span aria-hidden>{shellCopy.shareShort}</span>
      <span aria-hidden className="hidden sm:inline">{shellCopy.shareRest}</span>
    </button>
  );
}
