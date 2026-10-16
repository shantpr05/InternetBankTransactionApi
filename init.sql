
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

INSERT INTO recipient_classifications (recipient, classification)
VALUES
  ('ICA', 'Food'),
  ('SL', 'Transport'),
  ('Netflix', 'Entertainment'),
  ('Employer', 'Unknown'),
  ('Bookstore', 'Entertainment')
ON CONFLICT (recipient) DO NOTHING;

INSERT INTO transactions (date, recipient, amount)
SELECT seed.date, seed.recipient, seed.amount
FROM (
  VALUES
    ('2026-09-01'::date, 'ICA', -350.00::numeric),
    ('2026-09-02'::date, 'SL', -120.00::numeric),
    ('2026-09-03'::date, 'Netflix', -149.00::numeric),
    ('2026-09-04'::date, 'Employer', 30000.00::numeric),
    ('2026-09-05'::date, 'Bookstore', -225.00::numeric),
    ('2026-09-06'::date, 'ICA', -195.00::numeric)
) AS seed(date, recipient, amount)
WHERE NOT EXISTS (
  SELECT 1
  FROM transactions AS t
  WHERE t.date = seed.date
    AND t.recipient = seed.recipient
    AND t.amount = seed.amount
);
