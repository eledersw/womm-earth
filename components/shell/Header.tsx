import Link from "next/link";
import { shellCopy } from "@/lib/copy/globe";
import { ShareButton } from "./ShareButton";

// The instrument's enamel top strip: name plate left, controls right.
export function Header() {
  return (
    <header className="relative z-10 flex h-(--header-height) shrink-0 items-center justify-between gap-4 border-b border-enamel-seam bg-enamel px-4 text-enamel-ink shadow-[0_2px_6px_rgb(0_0_0/0.25)]">
      <Link
        href="/"
        className="group flex items-baseline gap-3 rounded-sm px-2 py-1 no-underline ring-1 ring-enamel-seam ring-inset shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] focus-visible:outline-signal-lamp"
      >
        <span className="font-condensed text-lg leading-none font-bold tracking-[0.1em] whitespace-nowrap uppercase sm:text-xl sm:tracking-[0.12em]">
          {shellCopy.productName}
        </span>
        <span className="scale-label hidden text-enamel-ink-2 sm:inline">{shellCopy.productRole}</span>
      </Link>
      <nav aria-label="Site" className="flex items-center gap-4">
        <Link
          href="/about"
          className="scale-label whitespace-nowrap text-enamel-ink-2 no-underline hover:text-enamel-ink focus-visible:outline-signal-lamp"
        >
          {shellCopy.about}
        </Link>
        <ShareButton />
      </nav>
    </header>
  );
}
