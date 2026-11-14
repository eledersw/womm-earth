import { z } from "zod";
const text = z.string().max(2000);
const number = z.number().finite();
const p = number.min(0).max(1);
const slope = z.object({ slope: number, intercept: number, ci_low: number, ci_high: number });
const kind = z.enum(["satellite", "reanalysis"]);
export const explainInputSchema = z.object({
  mode: z.literal("explain"), level: z.enum(["student", "scientist"]),
  regionName: text.min(1), period: z.string().min(1).max(80), seasonLabel: z.string().min(1).max(100),
  variable: z.object({
    id: z.string().min(1).max(100), name: text, unit: text, source: text, instrument: text.nullable(), kind,
    start_year: z.number().int(), end_year: z.number().int(), land_only: z.boolean(), ratio_scale: z.boolean(),
    definition_student: text, definition_scientist: text, doi: text.nullable(), signed_off: z.boolean(),
  }),
  analysis: z.object({
    region: z.object({ id: z.string().min(1).max(100), name: text, type: z.enum(["country", "state", "ocean", "named"]), centroid: z.tuple([number, number]), bbox: z.tuple([number, number, number, number]), nearest_cell_fallback: z.boolean(), valid_variables: z.array(z.string().max(100)).max(100), parent: text.nullable() }),
    monthly: z.array(z.object({ t: z.string().max(30), value: number.nullable(), anomaly: number.nullable() })).max(2400),
    yearly: z.array(z.object({ year: z.number().int(), value: number.nullable() })).max(200),
    fit: z.array(z.object({ year: z.number().int(), ols: number, ols_low: number, ols_high: number, sen: number })).max(200),
    stats: z.object({ n_years: z.number().int().nonnegative(), phi: number, resid_sd: number,
      ols: slope.extend({ se: number, p, r2: number, n_eff: number }), mk: z.object({ p, p_naive: p, z: number, tau: number }), sen: slope,
      tests_agree: z.boolean(), period_mean: number, change_per_decade: number, total_change: number, pct_of_mean_per_decade: number.nullable(),
    }).nullable(),
    verdict: z.object({ tier: z.enum(["confirmed", "not_proven", "no_case", "too_short"]), years_needed: z.number().int().nonnegative().nullable(), reason: text.nullable() }),
    provenance: z.object({ source: text, instrument: text.nullable(), product: text.nullable(), doi: text.nullable(), kind }),
    warnings: z.array(text).max(30),
  }),
}).strict().superRefine((input, ctx) => {
  if (input.regionName !== input.analysis.region.name || !input.analysis.region.valid_variables.includes(input.variable.id)) {
    ctx.addIssue({ code: "custom", message: "Mismatched case metadata" });
  }
});
export type ExplainInput = z.infer<typeof explainInputSchema>;
