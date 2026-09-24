import { input, select } from "@inquirer/prompts";
import type {
  Transaction,
  UpdateTransaction,
  CreateTransaction,
} from "./types";

const API_URL = "http://localhost:3000";

const promptTheme = {
  prefix: "",
};

// View all transactions
const viewTransactions = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/transactions`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const transactions = (await response.json()) as Transaction[];

    if (transactions.length === 0) {
      console.log("No transactions found.");
      return;
    }

    console.table(transactions);
  } catch (error) {
    console.error("Could not connect to the API.");
    console.error(error);
  }
};

// Get one transaction by ID
const getTransactionById = async (
  id: number,
): Promise<Transaction | null> => {
  try {
    const response = await fetch(`${API_URL}/transactions/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as Transaction;
  } catch (error) {
    console.error("Could not connect to the API.");
    console.error(error);
    return null;
  }
};

// Create transaction
const createTransaction = async (): Promise<void> => {
  console.log("\nEnter new transaction details:");

  const date = await input({
    message: "Date (YYYY-MM-DD)?",
    theme: promptTheme,
  });

  const recipient = await input({
    message: "Recipient?",
    theme: promptTheme,
  });

  const amountInput = await input({
    message: "Amount?",
    theme: promptTheme,
  });

  if (
    date.trim() === "" ||
    recipient.trim() === "" ||
    amountInput.trim() === ""
  ) {
    console.log("Date, recipient and amount are all required.");
    return;
  }

  const amount = Number(amountInput);

  if (Number.isNaN(amount)) {
    console.log("Invalid amount.");
    return;
  }

  const transaction: CreateTransaction = {
    date: date.trim(),
    recipient: recipient.trim(),
    amount,
  };

  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      console.log(`Create failed with status ${response.status}.`);
      return;
    }

    const createdTransaction = (await response.json()) as Transaction;

    console.log("\nTransaction created successfully:");
    console.log(`ID: ${createdTransaction.id}`);
    console.log(`Date: ${createdTransaction.date}`);
    console.log(`Recipient: ${createdTransaction.recipient}`);
    console.log(`Amount: ${createdTransaction.amount}`);
  } catch (error) {
    console.error("Could not connect to the API.");
    console.error(error);
  }
};

// View one transaction
const viewTransaction = async (): Promise<void> => {
  const idInput = await input({
    message: "Enter transaction ID?",
    theme: promptTheme,
  });

  const id = Number(idInput);

  if (!Number.isInteger(id) || id <= 0) {
    console.log("Invalid transaction ID.");
    return;
  }

  const transaction = await getTransactionById(id);

  if (!transaction) {
    console.log("Transaction not found.");
    return;
  }

  console.log("\nTransaction:");
  console.log(`ID: ${transaction.id}`);
  console.log(`Date: ${transaction.date}`);
  console.log(`Recipient: ${transaction.recipient}`);
  console.log(`Amount: ${transaction.amount}`);
};

// Update transaction
const updateTransaction = async (): Promise<void> => {
  const idInput = await input({
    message: "Enter transaction ID?",
    theme: promptTheme,
  });

  const id = Number(idInput);

  if (!Number.isInteger(id) || id <= 0) {
    console.log("Invalid transaction ID.");
    return;
  }

  const transaction = await getTransactionById(id);

  if (!transaction) {
    console.log("Transaction not found.");
    return;
  }

  console.log("\nCurrent transaction:");
  console.log(`ID: ${transaction.id}`);
  console.log(`Date: ${transaction.date}`);
  console.log(`Recipient: ${transaction.recipient}`);
  console.log(`Amount: ${transaction.amount}`);

  console.log("\nPress Enter to keep the current value.\n");

  const date = await input({
    message: `New date (${transaction.date})?`,
    theme: promptTheme,
  });

  const recipient = await input({
    message: `New recipient (${transaction.recipient})?`,
    theme: promptTheme,
  });

  const amountInput = await input({
    message: `New amount (${transaction.amount})?`,
    theme: promptTheme,
  });

  const updates: UpdateTransaction = {};

  if (date.trim() !== "") {
    updates.date = date.trim();
  }

  if (recipient.trim() !== "") {
    updates.recipient = recipient.trim();
  }

  if (amountInput.trim() !== "") {
    const amount = Number(amountInput);

    if (Number.isNaN(amount)) {
      console.log("Invalid amount.");
      return;
    }

    updates.amount = amount;
  }

  if (Object.keys(updates).length === 0) {
    console.log("No changes were made.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (response.status === 404) {
      console.log("Transaction not found.");
      return;
    }

    if (!response.ok) {
      console.log(`Update failed with status ${response.status}.`);
      return;
    }

    const updatedTransaction = (await response.json()) as Transaction;

    console.log("\nTransaction updated successfully:");
    console.log(`ID: ${updatedTransaction.id}`);
    console.log(`Date: ${updatedTransaction.date}`);
    console.log(`Recipient: ${updatedTransaction.recipient}`);
    console.log(`Amount: ${updatedTransaction.amount}`);
  } catch (error) {
    console.error("Could not connect to the API.");
    console.error(error);
  }
};

// Filter transactions by date
const filterTransactionsByDate = async (): Promise<void> => {
  console.log("\nFilter transactions by date.");
  console.log("Press Enter to leave a date empty.\n");

  const from = await input({
    message: "From date (YYYY-MM-DD)?",
    theme: promptTheme,
  });

  const to = await input({
    message: "To date (YYYY-MM-DD)?",
    theme: promptTheme,
  });

  const fromDate = from.trim();
  const toDate = to.trim();

  if (fromDate === "" && toDate === "") {
    console.log("Enter at least one date to filter transactions.");
    return;
  }

  const params = new URLSearchParams();

  if (fromDate !== "") {
    params.set("from", fromDate);
  }

  if (toDate !== "") {
    params.set("to", toDate);
  }

  try {
    const response = await fetch(
      `${API_URL}/transactions?${params.toString()}`,
    );

    if (!response.ok) {
      const errorResponse = (await response.json()) as {
        message?: string;
      };

      console.log(
        errorResponse.message ??
          `Filter failed with status ${response.status}.`,
      );

      return;
    }

    const transactions = (await response.json()) as Transaction[];

    if (transactions.length === 0) {
      console.log("No transactions found for the selected date range.");
      return;
    }

    console.log("\nFiltered transactions:");
    console.table(transactions);
  } catch (error) {
    console.error("Could not connect to the API.");
    console.error(error);
  }
};

// CLI menu
const showMenu = async (): Promise<void> => {
  let running = true;

  while (running) {
    const choice = await select({
      message: "Choose an option?",
      theme: promptTheme,
      choices: [
        {
          name: "Create a new transaction",
          value: "create",
        },
        {
          name: "View all transactions",
          value: "view-all",
        },
        {
          name: "View one transaction",
          value: "view",
        },
        {
          name: "Update transaction",
          value: "update",
        },
        {
          name: "Filter transactions by date",
          value: "filter-date",
        },
        {
          name: "Exit",
          value: "exit",
        },
      ],
    });

    switch (choice) {
      case "create":
        await createTransaction();
        break;

      case "view-all":
        await viewTransactions();
        break;

      case "view":
        await viewTransaction();
        break;

      case "update":
        await updateTransaction();
        break;

      case "filter-date":
        await filterTransactionsByDate();
        break;

      case "exit":
        running = false;
        console.log("Goodbye!");
        break;
    }
  }
};

const main = async (): Promise<void> => {
  await showMenu();
};

main().catch((error) => {
  console.error("Unexpected error:", error);
});