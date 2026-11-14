import { z } from "zod";
import { SEASONS } from "@/lib/state/case-codec";
export const chatInputSchema = z.object({
  mode: z.literal("chat"), level: z.enum(["student", "scientist"]),
  case: z.object({ variable: z.string().min(1).max(100), regions: z.array(z.string().min(1).max(100)).max(4), from: z.number().int().min(1000).max(2200), to: z.number().int().min(1000).max(2200), season: z.enum(SEASONS), months: z.array(z.number().int().min(1).max(12)).max(12).nullable(), level: z.enum(["student", "scientist"]) }).strict(),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(6000) }).strict()).min(1).max(20),
}).strict().superRefine((value, ctx) => {
  if (value.messages.at(-1)?.role !== "user" || value.messages.some((m, i) => m.role !== (i % 2 === 0 ? "user" : "assistant"))) ctx.addIssue({ code: "custom", message: "Invalid message sequence" });
});
export type ChatInput = z.infer<typeof chatInputSchema>;
