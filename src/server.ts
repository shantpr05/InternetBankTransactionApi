import express, { type Request, type Response } from "express";
import transactions from "../data/transactions.json";
import classifications from "../data/classifications.json";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// GET all transactions
app.get("/transactions", (req: Request, res: Response) => {
  res.status(200).json(transactions);
});

// Get one transaction
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

// Create a new transaction
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
  const classifications: Record<string, string> = {
    ICA: "Food",
    SL: "Transport",
    Netflix: "Entertainment",
  };

  // Only outgoing transactions need classification
  let classification: string | undefined;

  if (amount < 0) {
    classification = classifications[recipient] ?? "Unknown";
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