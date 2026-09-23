import express, { type Request, type Response } from "express";
import transactions from "../data/transactions.json";
import classifications from "../data/classifications.json";
import type { UpdateTransaction } from "./types.js";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// GET all transactions
app.get("/transactions", (req: Request, res: Response) => {
  res.status(200).json(transactions);
});

// GET one transaction by id
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

// PUT update transaction by id
app.put("/transactions/:id", (req: Request, res: Response) => {
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

  const updates: UpdateTransaction = req.body;

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