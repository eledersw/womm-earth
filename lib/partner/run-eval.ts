import { evalMain } from "./eval-cli";
void evalMain().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Evaluation could not run."); process.exitCode = 1; });
