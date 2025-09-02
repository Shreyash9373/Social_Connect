import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function POST(req: NextRequest, { params }: any) {
  //context: { params: { user_id: string } }
  //const { params } = context; // ✅ safely extract params
  const auth = await authMiddleware(req, ["admin"]);

  try {
    const body = await req.json();
    const { is_active } = body; // 👈 expects true or false from frontend

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active must be true or false" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, username, is_active`,
      [is_active, params.user_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: `User ${is_active ? "activated" : "deactivated"}`,
        user: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/admin/users/[user_id]/deactivate error:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
