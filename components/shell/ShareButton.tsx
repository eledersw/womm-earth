"use client";

import { Link2 } from "lucide-react";
import { shellCopy } from "@/lib/copy/globe";
import { shareCopy } from "@/lib/copy/share";
import { useUiStore } from "@/lib/state/ui-store";
import { ShareDialog, copyLink, currentShare } from "./ShareDialog";

// The whole case lives in the URL. With results open (?run=1) Share opens the
// share dialog (link that reopens the results, plus the card); otherwise it copies the link.
export function ShareButton() {
  const share = useUiStore((s) => s.share);

  function onShare() {
    const current = currentShare();
    if (current.results) useUiStore.getState().openShare(current);
    else void copyLink(current.href, shareCopy.caseLinkCopied);
  }

  return (
    <>
      <button
        type="button"
        onClick={onShare}
        aria-label={shellCopy.share}
        className="label-nav glass-pill inline-flex h-9 items-center gap-2 rounded-full px-3.5 whitespace-nowrap text-ink transition-[transform,background-color] duration-150 ease-out hover:bg-well-2 active:scale-[0.98]"
      >
        <Link2 aria-hidden className="size-4" strokeWidth={1.75} />
        <span aria-hidden>{shellCopy.shareShort}</span>
        <span aria-hidden className="hidden sm:inline">{shellCopy.shareRest}</span>
      </button>
      <ShareDialog share={share} onClose={() => useUiStore.getState().openShare(null)} />
    </>
  );
}
