import { Suspense } from "react";
import { GlobeArea } from "@/components/globe/GlobeArea";
import { CasePanel } from "@/components/panel/CasePanel";
import { AppShell } from "@/components/shell/AppShell";

// Both children read case state from the URL (nuqs), so both sit in Suspense.
export default function Home() {
  return (
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
  );
}
