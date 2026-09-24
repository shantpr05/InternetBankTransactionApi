import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import transactions from "../data/transactions.json";
import classifications from "../data/classifications.json";
import { type UpdateTransaction } from "./types";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Check if a date is valid and uses YYYY-MM-DD format
const isValidDate = (date: string): boolean => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
};

// Check if a transaction ID is a positive integer
const isValidTransactionId = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  const id = Number(value);

  return Number.isInteger(id) && id > 0;
};

// Check if a value is a non-empty string
const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

// Check if amount is a valid finite number
const isValidAmount = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

// Check if request body is a JSON object
const isObjectBody = (
  body: unknown,
): body is Record<string, unknown> => {
  return typeof body === "object" && body !== null && !Array.isArray(body);
};

// GET all transactions with optional date filtering
app.get("/transactions", (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (
    (from !== undefined && typeof from !== "string") ||
    (to !== undefined && typeof to !== "string")
  ) {
    res.status(400).json({
      message: "Invalid date filter",
    });
    return;
  }

  if (typeof from === "string" && !isValidDate(from)) {
    res.status(400).json({
      message: "Invalid from date. Use YYYY-MM-DD format",
    });
    return;
  }

  if (typeof to === "string" && !isValidDate(to)) {
    res.status(400).json({
      message: "Invalid to date. Use YYYY-MM-DD format",
    });
    return;
  }

  if (typeof from === "string" && typeof to === "string" && from > to) {
    res.status(400).json({
      message: "Invalid date interval: from cannot be later than to",
    });
    return;
  }

  let filteredTransactions = transactions;

  if (typeof from === "string") {
    filteredTransactions = filteredTransactions.filter(
      (transaction) => transaction.date >= from,
    );
  }

  if (typeof to === "string") {
    filteredTransactions = filteredTransactions.filter(
      (transaction) => transaction.date <= to,
    );
  }

  res.status(200).json(filteredTransactions);
});

// GET one transaction
app.get("/transactions/:id", (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (!isValidTransactionId(idParam)) {
    res.status(400).json({
      message: "Invalid transaction ID. ID must be a positive integer",
    });
    return;
  }

  const id = Number(idParam);

  const transaction = transactions.find(
    (transaction) => transaction.id === id,
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
app.delete("/transactions/:id", (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (!isValidTransactionId(idParam)) {
    res.status(400).json({
      message: "Invalid transaction ID. ID must be a positive integer",
    });
    return;
  }

  const id = Number(idParam);

  const transactionIndex = transactions.findIndex(
    (transaction) => transaction.id === id,
  );

  if (transactionIndex === -1) {
    res.status(404).json({
      message: "Transaction not found",
    });
    return;
  }

  const deletedTransaction = transactions.splice(
    transactionIndex,
    1,
  )[0];

  res.status(200).json(deletedTransaction);
});

// PUT update transaction by id
app.put("/transactions/:id", (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (!isValidTransactionId(idParam)) {
    res.status(400).json({
      message: "Invalid transaction ID. ID must be a positive integer",
    });
    return;
  }

  const id = Number(idParam);

  const transaction = transactions.find(
    (transaction) => transaction.id === id,
  );

  if (!transaction) {
    res.status(404).json({
      message: "Transaction not found",
    });
    return;
  }

  if (!isObjectBody(req.body)) {
    res.status(400).json({
      message: "Request body must be a JSON object",
    });
    return;
  }

  const { date, recipient, amount } = req.body;

  if (
    date === undefined &&
    recipient === undefined &&
    amount === undefined
  ) {
    res.status(400).json({
      message: "At least one of date, recipient or amount is required",
    });
    return;
  }

  if (
    date !== undefined &&
    (typeof date !== "string" || !isValidDate(date))
  ) {
    res.status(400).json({
      message: "Invalid date. Use YYYY-MM-DD format",
    });
    return;
  }

  if (
    recipient !== undefined &&
    !isNonEmptyString(recipient)
  ) {
    res.status(400).json({
      message: "Recipient must be a non-empty string",
    });
    return;
  }

  if (amount !== undefined && !isValidAmount(amount)) {
    res.status(400).json({
      message: "Amount must be a valid number",
    });
    return;
  }

  const updates: UpdateTransaction = {};

  if (date !== undefined) {
    updates.date = date;
  }

  if (recipient !== undefined) {
    updates.recipient = recipient.trim();
  }

  if (amount !== undefined) {
    updates.amount = amount;
  }

  if (updates.date !== undefined) {
    transaction.date = updates.date;
  }

  if (updates.recipient !== undefined) {
    transaction.recipient = updates.recipient;
  }

  if (updates.amount !== undefined) {
    transaction.amount = updates.amount;
  }

  res.status(200).json(transaction);
});

// POST create a new transaction
app.post("/transactions", (req: Request, res: Response) => {
  if (!isObjectBody(req.body)) {
    res.status(400).json({
      message: "Request body must be a JSON object",
    });
    return;
  }

  const { date, recipient, amount } = req.body;

  if (
    date === undefined ||
    recipient === undefined ||
    amount === undefined
  ) {
    res.status(400).json({
      message: "date, recipient and amount are required",
    });
    return;
  }

  if (typeof date !== "string" || !isValidDate(date)) {
    res.status(400).json({
      message: "Invalid date. Use YYYY-MM-DD format",
    });
    return;
  }

  if (!isNonEmptyString(recipient)) {
    res.status(400).json({
      message: "Recipient must be a non-empty string",
    });
    return;
  }

  if (!isValidAmount(amount)) {
    res.status(400).json({
      message: "Amount must be a valid number",
    });
    return;
  }

  const cleanRecipient = recipient.trim();

  const newId =
    transactions.length > 0
      ? Math.max(
          ...transactions.map((transaction) => transaction.id),
        ) + 1
      : 1;

  const classificationMap: Record<string, string> = {
    ICA: "Food",
    SL: "Transport",
    Netflix: "Entertainment",
  };

  let classification: string | undefined;

  if (amount < 0) {
    classification =
      classificationMap[cleanRecipient] ?? "Unknown";
  }

  const newTransaction = {
    id: newId,
    date,
    recipient: cleanRecipient,
    amount,
    ...(classification && { classification }),
  };

  transactions.push(newTransaction);

  res.status(201).json(newTransaction);
});

// GET all classifications
app.get("/classifications", (_req: Request, res: Response) => {
  res.status(200).json(classifications);
});

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

// Start the server on port 3000
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});