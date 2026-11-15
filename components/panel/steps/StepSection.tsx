"use client";

import { useId, type ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { caseCopy, type CaseStep } from "@/lib/copy/case";

export interface StepProps {
  children?: ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function StepSection({
  step,
  children,
  loading = false,
  error = false,
  onRetry,
}: StepProps & { step: CaseStep }) {
  const id = useId();
  const copy = caseCopy.steps[step];

  return (
    <section
      aria-labelledby={`${id}-title`}
      aria-busy={loading}
      className="min-w-0 rounded-xl border bg-card p-4 text-card-foreground"
      data-case-step={step}
    >
      <h2 id={`${id}-title`} className="label-mono text-[0.8rem] text-silver">
        {copy.label}
      </h2>
      <div className="mt-3 min-w-0">
        {loading ? (
          <div role="status" className="space-y-2">
            <span className="text-sm text-muted-foreground">{caseCopy.loading}</span>
            <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{caseCopy.error}</AlertDescription>
            {onRetry ? (
              <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={onRetry}>
                {caseCopy.retry}
              </Button>
            ) : null}
          </Alert>
        ) : (
          children ?? <p className="text-sm text-muted-foreground">{copy.empty}</p>
        )}
      </div>
    </section>
  );
}
