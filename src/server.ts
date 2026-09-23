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

// GET all classifications
app.get("/classifications", (req: Request, res: Response) => {
  res.status(200).json(classifications);
});

// Start the server on port 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});