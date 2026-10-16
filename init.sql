CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  recipient VARCHAR(100) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS recipient_classifications (
  recipient VARCHAR(100) PRIMARY KEY,
  classification VARCHAR(50) NOT NULL
);