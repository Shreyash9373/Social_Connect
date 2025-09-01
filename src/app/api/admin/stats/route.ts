// /app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req, ["admin"]);

  try {
    // Total users
    const totalUsersRes = await pool.query(`SELECT COUNT(*) FROM users`);

    // Total posts
    const totalPostsRes = await pool.query(`SELECT COUNT(*) FROM posts`);

    // Active today (users who logged in today)
    const activeTodayRes = await pool.query(
      `SELECT COUNT(*) 
       FROM users 
       WHERE DATE(last_login) = CURRENT_DATE`
    );

    const stats = {
      total_users: parseInt(totalUsersRes.rows[0].count, 10),
      total_posts: parseInt(totalPostsRes.rows[0].count, 10),
      active_today: parseInt(activeTodayRes.rows[0].count, 10),
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
