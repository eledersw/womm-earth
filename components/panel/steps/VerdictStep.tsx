import { StepSection, type StepProps } from "./StepSection";

export function VerdictStep(props: StepProps) {
  return <StepSection step="verdict" {...props} />;
}
