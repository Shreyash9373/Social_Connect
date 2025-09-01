import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/users/me → Fetch own profile with stats
export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req);
  if ("user" in auth === false) return auth; // middleware already returns NextResponse on error
  const { user } = auth as { user: any };

  try {
    // Fetch user profile
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, bio, avatar_url, website, location, profile_visibility, created_at, updated_at
       FROM users WHERE id = $1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = result.rows[0];

    // Fetch stats
    const statsResult = await pool.query(
      `SELECT 
         (SELECT COUNT(*)::int FROM follows WHERE following_id = $1) AS followers_count,
         (SELECT COUNT(*)::int FROM follows WHERE follower_id = $1) AS following_count,
         (SELECT COUNT(*)::int FROM posts WHERE user_id = $1) AS posts_count`,
      [user.id]
    );
    const postsResult = await pool.query(
      `SELECT p.id, p.image_url, p.content, p.created_at,
          u.id as author_id, u.username, u.avatar_url
   FROM posts p
   JOIN users u ON u.id = p.user_id
   WHERE p.user_id = $1
   ORDER BY p.created_at DESC`,
      [user.id]
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

    return NextResponse.json(
      {
        ...profile,
        stats: {
          followers: stats.followers_count,
          following: stats.following_count,
          posts: stats.posts_count,
        },
        posts,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/users/me → Update profile
export async function PUT(req: NextRequest) {
  const auth = await authMiddleware(req);
  if ("user" in auth === false) return auth;
  const { user } = auth as { user: any };

  try {
    const { bio, avatar_url, website, location, profile_visibility } =
      await req.json();

    // ✅ Validation
    if (bio && bio.length > 160) {
      return NextResponse.json(
        { error: "Bio must be ≤ 160 characters" },
        { status: 400 }
      );
    }

    if (website && !/^https?:\/\/.+$/.test(website)) {
      return NextResponse.json(
        { error: "Invalid website URL" },
        { status: 400 }
      );
    }

    if (
      profile_visibility &&
      !["public", "private", "followers_only"].includes(profile_visibility)
    ) {
      return NextResponse.json(
        { error: "Invalid profile visibility" },
        { status: 400 }
      );
    }

    // ✅ Update query (only non-null fields)
    const result = await pool.query(
      `UPDATE users 
       SET bio = COALESCE($1, bio),
           avatar_url = COALESCE($2, avatar_url),
           website = COALESCE($3, website),
           location = COALESCE($4, location),
           profile_visibility = COALESCE($5, profile_visibility),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, username, email, first_name, last_name, bio, avatar_url, website, location, profile_visibility, created_at, updated_at`,
      [bio, avatar_url, website, location, profile_visibility, user.id]
    );

    return NextResponse.json(
      { message: "Profile updated successfully", profile: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/users/me error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/me/avatar
export async function DELETE(req: NextRequest) {
  const auth = await authMiddleware(req);
  if ("user" in auth === false) return auth;
  const { user } = auth as { user: any };

  await pool.query("UPDATE users SET avatar_url = NULL WHERE id = $1", [
    user.id,
  ]);

  return NextResponse.json({ message: "Avatar removed" });
}
