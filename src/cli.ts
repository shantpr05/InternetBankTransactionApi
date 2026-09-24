import { select, input, number } from "@inquirer/prompts";

const API_URL = "http://localhost:3000";

type Transaction = {
  id: number;
  date: string;
  recipient: string;
  amount: number;
  classification?: string;
};

async function viewTransactions() {
  const response = await fetch(`${API_URL}/transactions`);

  if (!response.ok) {
    console.log("Failed to get transactions.");
    return;
  }

  const transactions: Transaction[] = await response.json();

  console.table(transactions);
}

async function viewOneTransaction() {
  const id = await number({
    message: "Enter transaction ID:",
  });

  if (id === undefined) {
    return;
  }

  const response = await fetch(`${API_URL}/transactions/${id}`);

  if (!response.ok) {
    const error = await response.json();
    console.log(`Error: ${error.message}`);
    return;
  }

  const transaction: Transaction = await response.json();

  console.table([transaction]);
}

async function addTransaction() {
  const date = await input({
    message: "Enter date (YYYY-MM-DD):",
  });

  const recipient = await input({
    message: "Enter recipient:",
  });

  const amount = await number({
    message: "Enter amount:",
  });

  if (amount === undefined) {
    console.log("Invalid amount.");
    return;
  }

  const response = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date,
      recipient,
      amount,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.log(`Error: ${result.message}`);
    return;
  }

  console.log("\nTransaction added successfully:");
  console.table([result]);
}

async function filterTransactions() {
  const from = await input({
    message: "From date (YYYY-MM-DD):",
  });

  const to = await input({
    message: "To date (YYYY-MM-DD):",
  });

  const response = await fetch(
    `${API_URL}/transactions?from=${from}&to=${to}`
  );

  const result = await response.json();

  if (!response.ok) {
    console.log(`Error: ${result.message}`);
    return;
  }

  if (result.length === 0) {
    console.log("No transactions found in this date interval.");
    return;
  }

  console.table(result);
}

async function main() {
  let running = true;

  while (running) {
    const answer = await select({
      message: "=== Internet Bank ===",
      choices: [
        {
          name: "View all transactions",
          value: "view-all",
        },
        {
          name: "View one transaction",
          value: "view-one",
        },
        {
          name: "Add transaction",
          value: "add",
        },
        {
          name: "Update transaction",
          value: "update",
        },
        {
          name: "Delete transaction",
          value: "delete",
        },
        {
          name: "Filter transactions by date",
          value: "filter",
        },
        {
          name: "Exit",
          value: "exit",
        },
      ],
    });

    switch (answer) {
      case "view-all":
        await viewTransactions();
        break;

      case "view-one":
        await viewOneTransaction();
        break;

      case "add":
        await addTransaction();
        break;

      case "update":
        console.log("Update transaction - coming next.");
        break;

      case "delete":
        console.log("Delete transaction - coming next.");
        break;

      case "filter":
        await filterTransactions();
        break;

      case "exit":
        running = false;
        console.log("Goodbye!");
        break;
    }
  }
}

main();