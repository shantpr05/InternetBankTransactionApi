
import { pool } from "./db";

export interface ClassifiedTransaction {
  id: number;
  date: string;
  recipient: string;
  amount: number;
  classification: string;
}

export interface RecipientClassification {
  recipient: string;
  classification: string;
}

export async function getClassifiedTransactions(): Promise<
  ClassifiedTransaction[]
> {
  const result = await pool.query<ClassifiedTransaction>(`
    SELECT
      t.id,
      TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
      t.recipient,
      t.amount::double precision AS amount,
      COALESCE(rc.classification, 'Unknown') AS classification
    FROM transactions AS t
    LEFT JOIN recipient_classifications AS rc
      ON t.recipient = rc.recipient
    ORDER BY t.id
  `);

  return result.rows;
}

export async function getRecipientClassifications(): Promise<
  RecipientClassification[]
> {
  const result = await pool.query<RecipientClassification>(`
    SELECT recipient, classification
    FROM recipient_classifications
    ORDER BY recipient
  `);

  return result.rows;
}
