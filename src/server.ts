
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import transactions from "../data/transactions.json";
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
app.get("/transactions", (req: Request, res: Response) => {
  const validation = dateFilterSchema.safeParse(req.query);

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  const { from, to } = validation.data;

  const filteredTransactions = transactions.filter(
    (transaction) =>
      (!from || transaction.date >= from) &&
      (!to || transaction.date <= to),
  );

  res.status(200).json(filteredTransactions);
});

// GET one transaction
app.get("/transactions/:id", (req: Request, res: Response) => {
  const validation = transactionIdSchema.safeParse(req.params.id);

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  const transaction = transactions.find(
    (item) => item.id === validation.data,
  );

  if (!transaction) {
    res.status(404).json({
      message: "Transaction not found",
    });
    return;
  }

  res.status(200).json(transaction);
});

// DELETE transaction by id
app.delete("/transactions/:id", async (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  const id = Number(idParam);

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
  const idParam = req.params.id;

  if (!idValidation.success) {
    sendValidationError(res, idValidation.error.issues);
    return;
  }

  const id = Number(idParam);

  if (!isObjectBody(req.body)) {
    res.status(400).json({
      message: "Request body must be a JSON object",
    });
    return;
  }

  const { date, recipient, amount } = req.body;

  if (!bodyValidation.success) {
    sendValidationError(res, bodyValidation.error.issues);
    return;
  }

  const { date, recipient, amount } = bodyValidation.data;

  if (date !== undefined) {
    transaction.date = date;
  }

  if (recipient !== undefined) {
    transaction.recipient = recipient;
  }

  if (amount !== undefined) {
    updates.amount = amount;
  }

  try {
    const result = await pool.query(
      ` 
      UPDATE transactions
      SET 
      date = COALESCE($1, date),
      recipient = COALESCE($2, recipient),
      amount = COALESCE($3, amount)
      WHERE id = $4
      RETURNING *
      `,
      [updates.date, updates.recipient, updates.amount, id],
    );

    const updatedTransaction = result.rows[0];

    if (!updatedTransaction) {
      res.status(404).json({
        message: "Transaction not found",
      });
      return;
    }

    res.status(200).json(updatedTransaction);
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// POST create transaction
app.post("/transactions", (req: Request, res: Response) => {
  const validation = createTransactionSchema.safeParse(req.body);

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  const { date, recipient, amount } = validation.data;

  const newId =
    transactions.length > 0
      ? Math.max(...transactions.map((item) => item.id)) + 1
      : 1;

  const classificationMap: Record<string, string> = {
    ICA: "Food",
    SL: "Transport",
    Netflix: "Entertainment",
  };

  const classification =
    amount < 0
      ? classificationMap[recipient] ?? "Unknown"
      : undefined;

  const newTransaction = {
    id: newId,
    date,
    recipient,
    amount,
    ...(classification && { classification }),
  };

  transactions.push(newTransaction);

  res.status(201).json(newTransaction);
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
