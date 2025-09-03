import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import pool from "@/lib/db"; // Import the shared pool instance

// GET /api/users -> List visible users
export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req, ["user", "admin"]);
  const requester = "user" in auth ? (auth as any).user : null;

  try {
    const result = await pool.query(
      `SELECT id, username, avatar_url, profile_visibility,role
       FROM users
       WHERE is_active = true
       ORDER BY created_at DESC`
    );

    // Filter out admins
    const users = result.rows.filter(
      (user) => user.role !== "admin" && user.id !== requester?.id
    );
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
