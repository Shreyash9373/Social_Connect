import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    // ✅ Read refresh token from cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;
    console.log("Refresh Token:", refreshToken);
    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 400 }
      );
    }

    // Check if refresh token is blacklisted
    const result = await pool.query(
      "SELECT * FROM token_blacklist WHERE token = $1",
      [refreshToken]
    );
    console.log("Blacklist check result:", result.rows);
    if (result.rows.length > 0) {
      return NextResponse.json(
        { error: "Refresh token is blacklisted. Please log in again." },
        { status: 401 }
      );
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        id: string;
        username: string;
        role: string;
      };

      // Issue new access token
      const newAccessToken = jwt.sign(
        { id: decoded.id, username: decoded.username, role: decoded.role },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      // ✅ Send new access token as cookie
      const res = NextResponse.json({
        message: "Access token refreshed successfully",
      });

      res.cookies.set("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60, // 15 minutes
      });

      return res;
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
