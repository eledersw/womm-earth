import { CasePanel } from "@/components/panel/CasePanel";

// Scaffold placeholder. The real composition (AppShell + GlobeArea + CasePanel)
// arrives in frontend-shell plan Task 3.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Earth Case Files</h1>
      <CasePanel />
    </main>
  );
}
