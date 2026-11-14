"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { caseCopy } from "@/lib/copy/case";
import { partnerCopy } from "@/lib/copy/partner";
import { LeadStep } from "./steps/LeadStep";
import { SceneStep } from "./steps/SceneStep";
import { TimelineStep } from "./steps/TimelineStep";
import { EvidenceStep } from "./steps/EvidenceStep";
import { VerdictStep } from "./steps/VerdictStep";

// No props: the page owns the slot. Task 2 connects the canonical useCase hook.
// Official api/_fixtures do not exist yet; display empty states until they land.
export function CasePanel() {
  return (
    <section aria-label={caseCopy.panel} className="w-full min-w-0">
      <Tabs defaultValue="case">
        <TabsList aria-label={caseCopy.tabs} className="w-full">
          <TabsTrigger value="case">{caseCopy.caseTab}</TabsTrigger>
          <TabsTrigger value="partner">{caseCopy.partnerTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="case" className="pt-2">
          <ol aria-label={caseCopy.stepsLabel} className="space-y-3">
            <li><LeadStep /></li>
            <li><SceneStep /></li>
            <li><TimelineStep /></li>
            <li><EvidenceStep /></li>
            <li><VerdictStep /></li>
          </ol>
        </TabsContent>
        <TabsContent value="partner" className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">{partnerCopy.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{partnerCopy.offline}</p>
        </TabsContent>
      </Tabs>
    </section>
  );
}
