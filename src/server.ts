
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

// DELETE transaction by ID
app.delete("/transactions/:id", (req: Request, res: Response) => {
  const validation = transactionIdSchema.safeParse(req.params.id);

  if (!validation.success) {
    sendValidationError(res, validation.error.issues);
    return;
  }

  const index = transactions.findIndex(
    (item) => item.id === validation.data,
  );

  if (index === -1) {
    res.status(404).json({
      message: "Transaction not found",
    });
    return;
  }

  const deletedTransaction = transactions.splice(index, 1)[0];

  res.status(200).json(deletedTransaction);
});

// PUT update transaction by ID
app.put("/transactions/:id", (req: Request, res: Response) => {
  const idValidation = transactionIdSchema.safeParse(req.params.id);

  if (!idValidation.success) {
    sendValidationError(res, idValidation.error.issues);
    return;
  }

  const transaction = transactions.find(
    (item) => item.id === idValidation.data,
  );

  if (!transaction) {
    res.status(404).json({
      message: "Transaction not found",
    });
    return;
  }

  const bodyValidation = updateTransactionSchema.safeParse(req.body);

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
    transaction.amount = amount;
  }

  res.status(200).json(transaction);
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
