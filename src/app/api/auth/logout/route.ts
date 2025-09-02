import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function POST(req: NextRequest) {
  try {
    // ✅ Read refresh token directly from cookies
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 400 }
      );
    }

    // Store refresh token in blacklist (optional, for security)
    await pool.query("INSERT INTO token_blacklist (token) VALUES ($1)", [
      refreshToken,
    ]);

    // ✅ Clear both cookies
    const res = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
    res.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    res.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
