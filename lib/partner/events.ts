import { z } from "zod";

export const partnerEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("tool_call"), name: z.string() }),
  z.object({ type: z.literal("tool_result"), name: z.string(), data: z.unknown() }),
  z.object({ type: z.literal("propose_case"), query: z.string(), title: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("done") }),
]);

export type PartnerEvent = z.infer<typeof partnerEventSchema>;
export const MAX_EVENT_BYTES = 256 * 1024;
