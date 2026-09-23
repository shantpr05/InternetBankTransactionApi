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

// GET all classifications
app.get("/classifications", (req: Request, res: Response) => {
  res.status(200).json(classifications);
});

// Start the server on port 3000
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});