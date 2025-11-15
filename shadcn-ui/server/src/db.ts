import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test connection
(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Connected to Neon at:", res.rows[0].now);
  } catch (err) {
    console.error("Neon DB connection error:", err);
  }
})();
