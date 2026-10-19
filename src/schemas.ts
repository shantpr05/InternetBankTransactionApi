
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

export const dateSchema = z.iso.date();

export const transactionIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .safe();

export const recipientSchema = z
  .string()
  .trim()
  .min(1, "Recipient is required")
  .max(100, "Recipient must be at most 100 characters");

export const amountSchema = z
  .number()
  .finite();

export const createTransactionSchema = z.strictObject({
  date: dateSchema,
  recipient: recipientSchema,
  amount: amountSchema,
});

export const updateTransactionSchema = createTransactionSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

export const dateFilterSchema = z
  .strictObject({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine(
    ({ from, to }) => !from || !to || from <= to,
    {
      message: "From date cannot be later than to date",
      path: ["to"],
    },
  );

export type CreateTransaction = z.infer<
  typeof createTransactionSchema
>;

export type UpdateTransactionInput = z.infer<
  typeof updateTransactionSchema
>;
