// /app/api/admin/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req, ["admin"]);

  try {
    const result = await pool.query(
      `SELECT p.id, p.content, p.image_url, p.like_count, p.comment_count, 
              p.created_at, u.username AS author, u.id AS author_id
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );

    return NextResponse.json({ posts: result.rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
