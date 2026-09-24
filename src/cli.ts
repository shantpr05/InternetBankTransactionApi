import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Transaction, UpdateTransaction } from "./types";

const API_URL = "http://localhost:3000";

const readline = createInterface({
  input,
  output,
});

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

const updateTransaction = async (): Promise<void> => {
  const idInput = await readline.question("Enter transaction ID: ");
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

  console.log("\nPress Enter to keep the current value.");

  const date = await readline.question(
    `New date (${transaction.date}): `,
  );

  const recipient = await readline.question(
    `New recipient (${transaction.recipient}): `,
  );

  const amountInput = await readline.question(
    `New amount (${transaction.amount}): `,
  );

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

const showMenu = async (): Promise<void> => {
  let running = true;

  while (running) {
    console.log("\n--- Internet Bank Transaction CLI ---");
    console.log("1. Update transaction");
    console.log("0. Exit");

    const choice = await readline.question("\nChoose an option: ");

    switch (choice.trim()) {
      case "1":
        await updateTransaction();
        break;

      case "0":
        running = false;
        console.log("Goodbye!");
        break;

      default:
        console.log("Invalid option.");
    }
  }

  readline.close();
};

const main = async (): Promise<void> => {
  await showMenu();
};

main().catch((error) => {
  console.error("Unexpected error:", error);
  readline.close();
});