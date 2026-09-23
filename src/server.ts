import express, { type Request, type Response } from "express";
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Start the server on port 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});