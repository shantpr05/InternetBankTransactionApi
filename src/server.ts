import express, { type Request, type Response } from "express";
import transactions from "../data/transactions.json";
import classifications from "../data/classifications.json";

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

// GET all transactions with optional date filtering
app.get("/transactions", (req: Request, res: Response) => {
  const { from, to } = req.query;

  // Validate that from and to are single query values
  if (
    (from !== undefined && typeof from !== "string") ||
    (to !== undefined && typeof to !== "string")
  ) {
    res.status(400).json({
      message: "Invalid date filter",
    });
    return;
  }

  // Validate from date
  if (typeof from === "string" && !isValidDate(from)) {
    res.status(400).json({
      message: "Invalid from date. Use YYYY-MM-DD format",
    });
    return;
  }

  // Validate to date
  if (typeof to === "string" && !isValidDate(to)) {
    res.status(400).json({
      message: "Invalid to date. Use YYYY-MM-DD format",
    });
    return;
  }

  // Validate date interval
  if (
    typeof from === "string" &&
    typeof to === "string" &&
    from > to
  ) {
    res.status(400).json({
      message: "Invalid date interval: from cannot be later than to",
    });
    return;
  }

  let filteredTransactions = transactions;

  if (typeof from === "string") {
    filteredTransactions = filteredTransactions.filter(
      (transaction) => transaction.date >= from
    );
  }

  if (typeof to === "string") {
    filteredTransactions = filteredTransactions.filter(
      (transaction) => transaction.date <= to
    );
  }

  res.status(200).json(filteredTransactions);
});

// GET one transaction
app.get("/transactions/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const transaction = transactions.find(
    (transaction) => transaction.id === id
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
  const id = Number(req.params.id);

  const transactionIndex = transactions.findIndex(
    (transaction) => transaction.id === id
  );

  if (transactionIndex === -1) {
    res.status(404).json({
      message: "Transaction not found",
    });
    return;
  }

  const deletedTransaction = transactions.splice(transactionIndex, 1)[0];

  res.status(200).json(deletedTransaction);
});

// POST create a new transaction
app.post("/transactions", (req: Request, res: Response) => {
  const { date, recipient, amount } = req.body;

  // Validate required fields
  if (!date || !recipient || amount === undefined) {
    res.status(400).json({
      message: "date, recipient and amount are required",
    });
    return;
  }

  // Create a new ID
  const newId =
    transactions.length > 0
      ? Math.max(...transactions.map((transaction) => transaction.id)) + 1
      : 1;

  // Classification mapping
  const classificationMap: Record<string, string> = {
    ICA: "Food",
    SL: "Transport",
    Netflix: "Entertainment",
  };

  // Only outgoing transactions need classification
  let classification: string | undefined;

  if (amount < 0) {
    classification = classificationMap[recipient] ?? "Unknown";
  }

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

// GET all classifications
app.get("/classifications", (req: Request, res: Response) => {
  res.status(200).json(classifications);
});

// Start the server on port 3000
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});