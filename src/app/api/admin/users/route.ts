// /app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/admin/users/
export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req, ["admin"]); // restrict to admins
  const admin = "user" in auth ? (auth as any).user : null;

  try {
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, is_active, role, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ users: result.rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
