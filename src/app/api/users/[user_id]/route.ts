import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/users/[user_id]
export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const auth = await authMiddleware(req); // user can be null for public view
  const requester = "user" in auth ? (auth as any).user : null;

  try {
    const { user_id } = params;

    // Fetch target user
    const result = await pool.query(
      `SELECT id, username, bio, avatar_url, website, location, profile_visibility 
       FROM users WHERE id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const target = result.rows[0];

    // 🔒 Privacy enforcement
    if (target.profile_visibility === "private") {
      if (!requester || requester.id !== target.id) {
        return NextResponse.json(
          { error: "This profile is private" },
          { status: 403 }
        );
      }
    }

    if (target.profile_visibility === "followers_only") {
      if (!requester) {
        return NextResponse.json(
          { error: "This profile is only visible to followers" },
          { status: 403 }
        );
      }

      const followCheck = await pool.query(
        "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
        [requester.id, target.id]
      );

      if (followCheck.rows.length === 0 && requester.id !== target.id) {
        return NextResponse.json(
          { error: "This profile is only visible to followers" },
          { status: 403 }
        );
      }
    }

    // 📊 Stats
    const statsResult = await pool.query(
      `SELECT 
         (SELECT COUNT(*)::int FROM follows WHERE following_id = $1) AS followers_count,
         (SELECT COUNT(*)::int FROM follows WHERE follower_id = $1) AS following_count,
         (SELECT COUNT(*)::int FROM posts WHERE user_id = $1) AS posts_count`,
      [target.id]
    );
    let isFollowing = false;
    if (requester) {
      const isFollowingResult = await pool.query(
        "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
        [requester.id, target.id]
      );
      isFollowing = isFollowingResult.rows.length > 0;
    }
    const postsResult = await pool.query(
      `SELECT p.id, p.image_url, p.content, p.created_at,
          u.id as author_id, u.username, u.avatar_url
   FROM posts p
   JOIN users u ON u.id = p.user_id
   WHERE p.user_id = $1
   ORDER BY p.created_at DESC`,
      [target.id]
    );
    const posts = postsResult.rows.map((row) => ({
      id: row.id,
      image_url: row.image_url,
      content: row.content,
      created_at: row.created_at,
      author: {
        id: row.author_id,
        username: row.username,
        avatar_url: row.avatar_url,
      },
    }));
    const stats = statsResult.rows[0];
    //   const postsResult = await pool.query(
    //     `SELECT id, image_url, caption, created_at
    //  FROM posts
    //  WHERE user_id = $1
    //  ORDER BY created_at DESC`,
    //     [target.id]
    //   );
    return NextResponse.json({
      ...target,
      stats: {
        followers: stats.followers_count,
        following: stats.following_count,
        posts: stats.posts_count,
      },
      is_following: isFollowing,
      posts,

      //  posts: postsResult.rows,
    });
  } catch (error: any) {
    console.error("GET /api/users/[user_id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
