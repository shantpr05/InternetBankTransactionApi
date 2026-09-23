import express, { type Request, type Response } from "express";
import transactions from "../data/transactions.json";
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

app.get("/transactions", (req: Request, res: Response) => {
  res.status(200).json(transactions);
});


// Start the server on port 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});