import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or missing token" },
        { status: 400 }
      );
    }

    // Find user by token
    const result = await pool.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    // Activate user
    await pool.query(
      "UPDATE users SET is_active = true, verification_token = NULL WHERE id = $1",
      [user.id]
    );

    // Redirect to login page after verification
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login`);
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
