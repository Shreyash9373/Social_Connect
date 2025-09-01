import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Find user with this reset token
    const result = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    // Check expiry
    if (
      !user.reset_token_expiry ||
      new Date(user.reset_token_expiry) < new Date()
    ) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password & clear token
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashedPassword, user.id]
    );

    return NextResponse.json(
      {
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
    // return NextResponse.redirect(
    //   `${process.env.NEXT_PUBLIC_BASE_URL}/password-reset-confirm`
    // );
  } catch (error: any) {
    console.error("Password reset confirm error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
