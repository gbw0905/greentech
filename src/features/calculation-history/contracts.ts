import { z } from "zod";
export const historyInputSchema = z.object({
  kind: z.enum(["ci", "credit", "optimizer"]),
  name: z.string().min(1).max(120),
  pathway: z.string().min(1).max(200),
  snapshot: z
    .string()
    .max(200000)
    .refine((value) => {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.state;
      } catch {
        return false;
      }
    }, "Invalid scenario snapshot"),
  metrics: z.object({
    ci: z.number().finite().nullable(),
    lcfs: z.number().finite().nullable(),
    rins: z.number().finite().nullable(),
    value: z.number().finite().nullable(),
  }),
});
export type HistoryInput = z.infer<typeof historyInputSchema>;
export type CalculationRun = HistoryInput & { id: string; createdAt: string };
