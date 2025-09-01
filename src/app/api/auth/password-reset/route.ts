import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import crypto from "crypto";
import { sendEmail } from "@/lib/server/mailer";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      // Security: return success even if email not found
      return NextResponse.json({
        message: "If an account exists, a reset email has been sent.",
      });
    }

    const user = result.rows[0];

    // Generate reset token + expiry (1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    // Save to DB
    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
      [resetToken, expiry, user.id]
    );

    // Build reset link
    // const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/password-reset-confirm?token=${resetToken}`;
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/password-reset-confirm?token=${resetToken}`;

    // Send email
    await sendEmail(
      email,
      "Password Reset Request",
      `Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 15 minutes.`
    );

    return NextResponse.json({
      message: "If an account exists, a reset email has been sent.",
    });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
