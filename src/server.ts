import { pool } from "./db";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import dotenv from "dotenv";
import { getRecipientClassifications } from "./classifications";
import {
  createTransactionSchema,
  dateFilterSchema,
  transactionIdSchema,
  updateTransactionSchema,
} from "./schemas";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const sendValidationError = (
  res: Response,
  issues: { path: PropertyKey[]; message: string }[],
): void => {
  res.status(400).json({
    message: "Validation failed",
    errors: issues.map((issue) => ({
      field: issue.path.map(String).join(".") || "request",
      message: issue.message,
    })),
  });
};

// GET all transactions with optional date filtering

app.get("/transactions", async (req: Request, res: Response) => {
  const validation = dateFilterSchema.safeParse(req.query);

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  const { from, to } = validation.data;

  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.date,
         t.recipient,
         t.amount,
         COALESCE(rc.classification, 'Unknown') AS classification
       FROM public.transactions AS t
       LEFT JOIN public.recipient_classifications AS rc
         ON rc.recipient = t.recipient
       WHERE ($1::date IS NULL OR t.date >= $1::date)
         AND ($2::date IS NULL OR t.date <= $2::date)
       ORDER BY t.date, t.id`,
      [from ?? null, to ?? null],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET one transaction

app.get("/transactions/:id", async (req: Request, res: Response) => {
  const validation = transactionIdSchema.safeParse(req.params.id);

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.date,
         t.recipient,
         t.amount,
         COALESCE(rc.classification, 'Unknown') AS classification
       FROM public.transactions AS t
       LEFT JOIN public.recipient_classifications AS rc
         ON rc.recipient = t.recipient
       WHERE t.id = $1`,
      [validation.data],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

 // DELETE transaction by id
app.delete("/transactions/:id", async (req: Request, res: Response) => {
  const idParam = req.params.id;

  const validation = transactionIdSchema.safeParse(idParam);

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  const id = validation.data;

  try {
    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 RETURNING *",
      [id],
    );

    const deletedTransaction = result.rows[0];

    if (!deletedTransaction) {
      res.status(404).json({
        message: "Transaction not found",
      });
      return;
    }

    res.status(200).json(deletedTransaction);
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});
// PUT update transaction by id

app.put("/transactions/:id", async (req: Request, res: Response) => {
  const idValidation = transactionIdSchema.safeParse(req.params.id);

  if (!idValidation.success) {
    sendValidationError(res, idValidation.error.issues);
    return;
  }

  const bodyValidation = updateTransactionSchema.safeParse(req.body);

  if (!bodyValidation.success) {
    sendValidationError(res, bodyValidation.error.issues);
    return;
  }

  const id = idValidation.data;
  const { date, recipient, amount } = bodyValidation.data;

  try {
    const result = await pool.query(
      `UPDATE public.transactions
       SET date = COALESCE($1, date),
           recipient = COALESCE($2, recipient),
           amount = COALESCE($3, amount)
       WHERE id = $4
       RETURNING id, date, recipient, amount`,
      [date ?? null, recipient ?? null, amount ?? null, id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    const updated = result.rows[0];

    const classificationResult = await pool.query(
      `SELECT classification
       FROM public.recipient_classifications
       WHERE recipient = $1`,
      [updated.recipient],
    );

    res.status(200).json({
      ...updated,
      classification:
        classificationResult.rows[0]?.classification ?? "Unknown",
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST create transaction

app.post("/transactions", async (req: Request, res: Response) => {
  const validation = createTransactionSchema.safeParse(req.body);

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  const { date, recipient, amount } = validation.data;

  try {
    const classificationResult = await pool.query(
      `SELECT classification
       FROM public.recipient_classifications
       WHERE recipient = $1`,
      [recipient],
    );

    const classification =
      classificationResult.rows[0]?.classification ?? "Unknown";

    const result = await pool.query(
      `INSERT INTO public.transactions (date, recipient, amount)
       VALUES ($1, $2, $3)
       RETURNING id, date, recipient, amount`,
      [date, recipient, amount],
    );

    res.status(201).json({
      ...result.rows[0],
      classification,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET classifications from PostgreSQL
app.get(
  "/classifications",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const classifications = await getRecipientClassifications();

      res.status(200).json(classifications);
    } catch (error) {
      next(error);
    }
  },
);

// Handle unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Handle malformed JSON and unexpected server errors
app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof SyntaxError) {
      res.status(400).json({
        message: "Invalid JSON body",
      });
      return;
    }

    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });
  },
);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
