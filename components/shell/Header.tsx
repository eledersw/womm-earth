import Link from "next/link";
import { shellCopy } from "@/lib/copy/globe";
import { ShareButton } from "./ShareButton";
import { ThemeSwitch } from "./ThemeSwitch";

// Floating over space, Fragment-style: wordmark left; capitals nav, the colour
// scheme pill and Share right. Only the controls catch the pointer, so the
// globe stays draggable underneath.
export function Header() {
  return (
    <header className="pointer-events-none relative z-20 flex h-(--header-height) shrink-0 items-center justify-between gap-4 px-6 min-[900px]:absolute min-[900px]:inset-x-0 min-[900px]:top-0">
      <Link
        href="/"
        className="pointer-events-auto flex items-center gap-3 rounded-lg px-1 py-1 text-silver no-underline"
      >
        <svg aria-hidden viewBox="0 0 32 32" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="16" cy="16" r="7" />
          <ellipse cx="16" cy="16" rx="14" ry="5.2" transform="rotate(-24 16 16)" />
        </svg>
        <span className="font-display text-[1.375rem] leading-none font-medium tracking-[-0.01em] whitespace-nowrap">
          {shellCopy.productName}
        </span>
      </Link>
      <nav aria-label="Site" className="pointer-events-auto flex items-center gap-3 sm:gap-5">
        <Link
          href="/about"
          className="label-nav hidden px-1 py-2 text-ink-2 no-underline transition-colors hover:text-ink sm:inline"
        >
          {shellCopy.about}
        </Link>
        <div className="hidden md:block">
          <ThemeSwitch />
        </div>
        <ShareButton />
      </nav>
    </header>
  );
}
