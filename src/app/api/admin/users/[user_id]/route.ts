// /app/api/admin/users/[user_id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export async function GET(
  req: NextRequest,
  context: { params: { user_id: string } }
) {
  const { params } = context; // ✅ safely extract params
  const auth = await authMiddleware(req, ["admin"]);

  try {
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, is_active, role, created_at, last_login, bio, avatar_url, website, location
       FROM users
       WHERE id = $1`,
      [params.user_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/users/[user_id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
