"use client";

import { Download, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { shareCopy } from "@/lib/copy/share";
import { cardFileName, cardPath } from "@/lib/share/card";
import { caseFromQuery, type CaseState } from "@/lib/state/case-codec";

/** The current page's link and Case, read when the dialog opens (the URL is the Case). */
export function currentShare(): { href: string; state: CaseState; results: boolean } {
  const params = new URLSearchParams(window.location.search);
  const state = caseFromQuery(params);
  return { href: window.location.href, state, results: params.get("run") === "1" && state.regions.length > 0 };
}

export async function copyLink(href: string, copied: string) {
  try {
    await navigator.clipboard.writeText(href);
    toast.success(copied);
  } catch {
    toast.error(shareCopy.linkFailed);
  }
}

async function cardFile(state: CaseState): Promise<File> {
  const response = await fetch(cardPath(state, { wait: true }));
  if (!response.ok) throw new Error("card");
  return new File([await response.blob()], cardFileName(state), { type: "image/png" });
}

// Share a Case's results: the link (opens straight to the results) and the card,
// a picture of the verdicts drawn by /api/card from the same Case.
export function ShareDialog({ share, onClose }: { share: { href: string; state: CaseState } | null; onClose: () => void }) {
  const [card, setCard] = useState<{ src: string; status: "loading" | "ready" | "failed" } | null>(null);
  const src = share ? cardPath(share.state, { wait: true }) : "";
  const status = card?.src === src ? card.status : "loading";
  const [busy, setBusy] = useState(false);
  const canShareFiles = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  async function download() {
    if (!share) return;
    setBusy(true);
    try {
      const file = await cardFile(share.state);
      const url = URL.createObjectURL(file);
      const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      toast.error(shareCopy.downloadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function shareNative() {
    if (!share) return;
    setBusy(true);
    try {
      const file = await cardFile(share.state);
      const data: ShareData = { url: share.href, files: [file] };
      await navigator.share(navigator.canShare(data) ? data : { url: share.href });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast.error(shareCopy.downloadFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!share} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="glass gap-5 p-5 sm:max-w-[34rem]">
        <DialogHeader>
          <DialogTitle className="label-mono text-silver">{shareCopy.dialogTitle}</DialogTitle>
          <DialogDescription className="text-ink-2">{shareCopy.dialogBody}</DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[1200/630] overflow-hidden rounded-lg border border-hairline bg-space">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- a generated PNG, not a static asset
            <img key={src} src={src} alt={shareCopy.cardAlt} className="size-full object-cover transition-opacity duration-300 data-[status=loading]:opacity-0"
              data-status={status}
              onLoad={() => setCard({ src, status: "ready" })} onError={() => setCard({ src, status: "failed" })} />
          ) : null}
          {status !== "ready" ? (
            <p role="status" className="label-mono absolute inset-0 grid place-items-center px-6 text-center text-ink-3">
              {status === "failed" ? shareCopy.cardFailed : shareCopy.cardLoading}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={() => share && copyLink(share.href, shareCopy.linkCopied)}>
            <Link2 aria-hidden strokeWidth={1.75} /> {shareCopy.copyLink}
          </Button>
          <Button size="lg" variant="outline" className="flex-1 font-mono font-normal tracking-[0.16em] uppercase" onClick={download} disabled={busy || status !== "ready"}>
            <Download aria-hidden strokeWidth={1.75} /> {shareCopy.downloadCard}
          </Button>
          {canShareFiles ? (
            <Button size="lg" variant="outline" className="flex-1 font-mono font-normal tracking-[0.16em] uppercase sm:hidden" onClick={shareNative} disabled={busy || status !== "ready"}>
              <Share2 aria-hidden strokeWidth={1.75} /> {shareCopy.shareNative}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
