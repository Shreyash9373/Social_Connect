import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// GET /api/users
export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req, ["admin"]); // restrict to admins
  if ("user" in auth === false) return auth;
  const { user } = auth as { user: any };

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    let query = `SELECT id, username, email, role, created_at FROM users`;
    const values: any[] = [];

    if (q) {
      query += ` WHERE username ILIKE $1 OR email ILIKE $1`;
      values.push(`%${q}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
