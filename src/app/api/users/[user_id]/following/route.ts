import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/users/[user_id]/followers/
// Returns a list of users who follow the user_id.
export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const auth = await authMiddleware(req);
  const requester = "user" in auth ? (auth as any).user : null;

  try {
    const userId = params.user_id;

    // First, fetch the target user's profile and check privacy settings.
    const targetUserRes = await pool.query(
      `SELECT id, profile_visibility FROM users WHERE id = $1`,
      [userId]
    );
    const targetUser = targetUserRes.rows[0];

    // Privacy checks
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      targetUser.profile_visibility === "private" &&
      (!requester || requester.id !== userId)
    ) {
      return NextResponse.json(
        { error: "This list is private" },
        { status: 403 }
      );
    }

    // Fetch the list of followers with details
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, u.bio
       FROM users u
       JOIN follows f ON u.id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/users/[user_id]/followers/ error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
