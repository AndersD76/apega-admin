require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function addPaymentFields() {
  console.log('Adding payment fields to users table...');

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Add PIX and bank account fields to users table
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS pix_key_type VARCHAR(20),
      ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255),
      ADD COLUMN IF NOT EXISTS bank_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(20),
      ADD COLUMN IF NOT EXISTS bank_account VARCHAR(30),
      ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(20),
      ADD COLUMN IF NOT EXISTS cpf VARCHAR(14)
    `;

    console.log('Payment fields added successfully!');

    // Verify columns were added
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('pix_key', 'pix_key_type', 'bank_code', 'bank_agency', 'bank_account', 'cpf')
    `;

    console.log('Verified columns:', columns);

  } catch (error) {
    console.error('Error adding payment fields:', error);
    throw error;
  }
}

addPaymentFields();
