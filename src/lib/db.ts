import { Pool } from "pg";

// Ensure the DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const pool: Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // ✅ important for Vercel
  max: 15, // Set the maximum number of connections in the pool
});

export default pool;
