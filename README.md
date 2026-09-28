# Internet Bank Transaction App

A small Internet Bank Transaction App built with **Node.js, Express, TypeScript, and @inquirer/prompts**.

The application provides a REST API for managing savings account transactions and a terminal application that communicates with the API using HTTP requests.

The project supports CRUD operations, automatic classification of outgoing transactions, date filtering, input validation, and error handling.

## Features

* View all transactions
* View one transaction by ID
* Create a transaction
* Update a transaction
* Delete a transaction
* Filter transactions by date
* View available classifications
* Automatically classify outgoing transactions
* Validate transaction input
* Handle invalid IDs and missing transactions
* Terminal application using `@inquirer/prompts`
* CLI communicates with the Express API using HTTP requests
* Transaction and classification data are simulated using JSON files

## Technologies

* Node.js
* Express
* TypeScript
* `@inquirer/prompts`
* JSON
* REST API
* Git and GitHub

## Project Structure

```text
InternetBankTransactionApi/
├── src/
│   ├── server.ts
│   ├── cli.ts
│   └── types.ts
│
├── data/
│   ├── transactions.json
│   └── classifications.json
│
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

Clone the repository and install the dependencies:

```bash
npm install
```

## Start the API

Start the Express API with:

```bash
npx tsx src/server.ts
```

The API runs on:

```text
http://localhost:3000
```

## Start the Terminal Application

Keep the API running and open another terminal.

Start the CLI with:

```bash
npx tsx src/cli.ts
```

The terminal application communicates with the Express API. It does not read the transaction JSON data directly.

## API Endpoints

| Method | Endpoint            | Description                   |
| ------ | ------------------- | ----------------------------- |
| GET    | `/transactions`     | Get all transactions          |
| GET    | `/transactions/:id` | Get one transaction           |
| POST   | `/transactions`     | Create a transaction          |
| PUT    | `/transactions/:id` | Update a transaction          |
| DELETE | `/transactions/:id` | Delete a transaction          |
| GET    | `/classifications`  | Get available classifications |

### Date Filtering

Transactions can be filtered using `from` and `to` query parameters:

```text
GET /transactions?from=2026-09-01&to=2026-09-05
```

Example:

```text
From: 2026-09-01
To: 2026-09-05
```

The API returns transactions whose dates are inside the selected interval.

## Terminal Application

The terminal application provides a menu for interacting with the bank API.

```text
=== Internet Bank ===

View all transactions
View one transaction
Add transaction
Update transaction
Delete transaction
Filter transactions by date
Exit
```

The user can select an action using `@inquirer/prompts`.

The CLI sends HTTP requests to the Express API. For example, when viewing transactions, the CLI sends:

```text
GET /transactions
```

The API returns the transactions and the CLI displays them.

## Transaction Classification

Only outgoing transactions are classified.

The current classification rules include:

| Recipient       | Classification |
| --------------- | -------------- |
| ICA             | Food           |
| SL              | Transport      |
| Netflix         | Entertainment  |
| Other recipient | Unknown        |

Incoming transactions, such as salary payments, do not receive a classification.

## Creating a Transaction

The required fields are:

* `date`
* `recipient`
* `amount`

Example:

```json
{
  "date": "2026-09-10",
  "recipient": "ICA",
  "amount": -350
}
```

An outgoing transaction is automatically classified based on its recipient.

For example:

```text
ICA → Food
SL → Transport
Netflix → Entertainment
Unknown recipient → Unknown
```

## Updating a Transaction

The following transaction fields can be updated:

* `date`
* `recipient`
* `amount`

The transaction ID cannot be changed.

When updating a transaction, the application validates the new values before applying the changes.

## Date Filtering Decisions

The following decisions were made for date filtering:

* The start date is included.
* The end date is included.
* Dates must use the `YYYY-MM-DD` format.
* Invalid dates return HTTP `400 Bad Request`.
* If the start date is after the end date, the API returns HTTP `400 Bad Request`.
* If there are no transactions in the selected interval, an empty list is returned.

Example:

```text
From: 2026-09-01
To: 2026-09-05
```

Both `2026-09-01` and `2026-09-05` are included.

## Input Validation

The API validates transaction input before processing requests.

### Date

Dates must:

* Use `YYYY-MM-DD`
* Represent a real calendar date

Example:

```text
2026-09-24
```

is valid.

```text
2026-02-30
```

is invalid.

### Transaction ID

Transaction IDs must be positive integers.

Examples:

```text
1       → valid
25      → valid
abc     → invalid
-1      → invalid
1.5     → invalid
```

### Amount

The amount must be a number.

Invalid input returns HTTP `400 Bad Request`.

### Recipient

The recipient is required and cannot be an empty string.

## Error Handling

The API uses HTTP status codes to indicate the result of a request.

| Status            | Meaning                          |
| ----------------- | -------------------------------- |
| `200 OK`          | Request completed successfully   |
| `201 Created`     | Transaction created successfully |
| `400 Bad Request` | Invalid input                    |
| `404 Not Found`   | Transaction does not exist       |

Examples of error messages include:

```json
{
  "message": "Transaction not found"
}
```

and:

```json
{
  "message": "Invalid transaction ID. ID must be a positive integer."
}
```

## Data

The project uses JSON files to simulate external services:

```text
data/transactions.json
data/classifications.json
```

No database or real external service is required for this assignment.

Transaction changes are handled in memory while the application is running.

## CLI and API Communication

The terminal application communicates with the Express API through HTTP.

The CLI does not access `transactions.json` directly.

The general flow is:

```text
User
  ↓
Terminal Application
  ↓
HTTP Request
  ↓
Express API
  ↓
Transaction Data
  ↓
Express API
  ↓
Terminal Application
  ↓
User
```

## GitHub Workflow

The project is developed using:

* GitHub Projects
* GitHub Issues
* Feature branches
* Pull Requests
* Clear commit messages

Each feature is developed in a focused branch and merged through a Pull Request.

## Assignment Goal

The goal of this project is to practise:

* TypeScript
* Express
* REST APIs
* CRUD operations
* HTTP requests
* Terminal applications
* Input validation
* Error handling
* Git and GitHub

The application is intentionally kept simple and is not intended to be a production-ready banking system.
