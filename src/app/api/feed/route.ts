import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req);
  const requester = "user" in auth ? (auth as any).user : null;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const postsRes = await pool.query(
      `
  SELECT 
    p.id,
    p.image_url,
    p.content,
    p.created_at,
    u.id AS author_id,
    u.username,
    u.avatar_url,
    p.like_count,
    (
      SELECT COUNT(*) 
      FROM comments c 
      WHERE c.post_id = p.id AND c.is_active = TRUE
    ) AS comment_count,
    EXISTS (
      SELECT 1 FROM likes l 
      WHERE l.post_id = p.id AND l.user_id = $3
    ) AS liked_by_me
  FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE 
    -- show own posts
    p.user_id = $3
    OR
    -- show posts of followed users
    p.user_id IN (
      SELECT following_id 
      FROM follows 
      WHERE follower_id = $3
    )
  ORDER BY p.created_at DESC
  LIMIT $1 OFFSET $2;
  `,
      [limit, offset, requester?.id || null]
    );

    return NextResponse.json({ posts: postsRes.rows });
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
