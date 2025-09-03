import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import crypto from "crypto";
import { sendEmail } from "@/lib/server/mailer";
import pool from "@/lib/db"; // Import the shared pool instance

// Database connection
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function POST(req: NextRequest) {
  try {
    const { email, username, password, first_name, last_name } =
      await req.json();

    // Validation
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error: "Username must be 3-30 chars, only alphanumeric + underscores",
        },
        { status: 400 }
      );
    }

    // Check duplicates
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Email or username already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Insert user as inactive
    const newUser = await pool.query(
      `INSERT INTO users (email, username, password, first_name, last_name, is_active, verification_token) 
       VALUES ($1, $2, $3, $4, $5, false, $6) 
       RETURNING id, email, username, first_name, last_name, is_active`,
      [
        email,
        username,
        hashedPassword,
        first_name,
        last_name,
        verificationToken,
      ]
    );

    const user = newUser.rows[0];

    // Build verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${verificationToken}`;

    // Send email
    await sendEmail(
      email,
      "Verify your SocialConnect account",
      `Welcome to SocialConnect!\n\nPlease verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link will activate your account.`
    );

    return NextResponse.json(
      {
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          is_active: user.is_active,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
