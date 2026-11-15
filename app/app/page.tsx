import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { GlobeArea } from "@/components/globe/GlobeArea";
import { CasePanel } from "@/components/panel/CasePanel";
import { AppShell } from "@/components/shell/AppShell";
import { shellCopy } from "@/lib/copy/globe";
import { cardPath } from "@/lib/share/card";
import { caseFromQuery } from "@/lib/state/case-codec";

// A shared Case link previews as its share card (the verdicts as a picture).
export async function generateMetadata({ searchParams }: PageProps<"/app">): Promise<Metadata> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const state = caseFromQuery(query);
  if (!state.regions.length) return {};
  const image = { url: cardPath(state), width: 1200, height: 630, alt: "WOMM Earth case results" };
  const title = `${shellCopy.productName} · Case file`;
  return {
    openGraph: { title, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, images: [image.url] },
  };
}

// The metadata reads the request's query: mark the page as deliberately dynamic
// (Cache Components) while the shell still prerenders.
async function RequestMarker() {
  await connection();
  return null;
}

// Both children read case state from the URL (nuqs), so both sit in Suspense.
export default function Home() {
  return (
    <>
      <Suspense><RequestMarker /></Suspense>
      <AppShell
        panel={
          <Suspense>
            <CasePanel />
          </Suspense>
        }
        globe={
          <Suspense>
            <GlobeArea />
          </Suspense>
        }
      />
    </>
  );
}
