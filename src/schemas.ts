
import { z } from "zod";

export const classificationSchema = z.enum([
  "Food",
  "Transport",
  "Entertainment",
  "Unknown",
]);

export type Classification = z.infer<
  typeof classificationSchema
>;
