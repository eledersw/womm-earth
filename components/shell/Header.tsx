import Image from "next/image";
import Link from "next/link";
import { shellCopy } from "@/lib/copy/globe";
import { ShareButton } from "./ShareButton";

// Floating over space, Fragment-style: the logo (mark + wordmark) on the left, mono
// capitals nav and Share on the right. Only the controls catch the pointer,
// so the globe stays draggable underneath.
export function Header() {
  return (
    <header className="pointer-events-none relative z-20 flex h-(--header-height) shrink-0 items-center justify-between gap-4 px-7 min-[900px]:absolute min-[900px]:inset-x-0 min-[900px]:top-0 min-[900px]:px-6">
      <Link
        href="/"
        className="pointer-events-auto shrink-0 rounded-lg py-1 no-underline"
      >
        {/* Silver logo from public/ (README.txt there lists the variants). */}
        <Image src="/womm-earth-logo-dark-mode.svg" alt={shellCopy.productName} width={206} height={27} priority
          className="h-6 w-auto sm:h-[30px]" />
      </Link>
      <nav aria-label="Site" className="pointer-events-auto flex items-center gap-3 sm:gap-6">
        <Link
          href="/about"
          className="label-nav px-1 py-2 text-ink-2 no-underline transition-colors hover:text-ink"
        >
          {shellCopy.about}
        </Link>
        <ShareButton />
      </nav>
    </header>
  );
}
