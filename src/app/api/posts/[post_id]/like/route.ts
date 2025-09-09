import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// GET /api/posts/[post_id]/like-status/
// Check if the current user has liked a post and get the total like count.
export async function GET(req: NextRequest, { params }: any) {
  // context: { params: { post_id: string } }
  // const { params } = context;
  const auth = await authMiddleware(req); // user can be null for public view
  const requester = "user" in auth ? (auth as any).user : null;

  try {
    const postId = params.post_id;
    // Get the total like count for the post
    const likeCountRes = await pool.query(
      `SELECT like_count FROM posts WHERE id = $1`,
      [postId]
    );

    if (likeCountRes.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const likeCount = likeCountRes.rows[0].like_count;

    // Check if the current user has liked this post
    const userLikeRes = await pool.query(
      `SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2`,
      [requester.id, postId]
    );
    const isLiked = userLikeRes.rows.length > 0;

    return NextResponse.json({ isLiked, likeCount });
  } catch (error) {
    console.error("GET /api/posts/[post_id]/like-status error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/posts/[post_id]/like/
// Allow a user to like a post.
import { supabaseServer } from "@/lib/supabaseServer"; // service role supabase client

export async function POST(req: NextRequest, { params }: any) {
  //context: { params: { post_id: string } }
  //const { params } = context;
  const auth = await authMiddleware(req);
  const requester = "user" in auth ? (auth as any).user : null;

  try {
    const postId = params.post_id;

    // Start a transaction
    await pool.query("BEGIN");

    // Add the like relationship
    const likeResult = await pool.query(
      `INSERT INTO likes (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING RETURNING *`,
      [requester.id, postId]
    );

    if (likeResult.rowCount > 0) {
      // ✅ Only increment + notify if it was a new like
      await pool.query(
        `UPDATE posts SET like_count = like_count + 1 WHERE id = $1`,
        [postId]
      );

      // Fetch post author
      const postAuthorRes = await pool.query(
        `SELECT user_id FROM posts WHERE id = $1`,
        [postId]
      );
      const postAuthorId = postAuthorRes.rows[0]?.user_id;

      // ✅ Insert notification if liker ≠ author
      if (postAuthorId && postAuthorId !== requester.id) {
        await supabaseServer.from("notifications").insert({
          recipient: postAuthorId,
          sender: requester.id,
          notification_type: "like",
          post: postId,
          message: `${requester.username} liked your post`,
        });
      }
    }

    await pool.query("COMMIT");

    return NextResponse.json({ message: "Post liked" }, { status: 201 });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("POST /api/posts/[post_id]/like error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[post_id]/like/
// Allow a user to unlike a post.
export async function DELETE(req: NextRequest, { params }: any) {
  //context: { params: { post_id: string } }
  //const { params } = context;
  const auth = await authMiddleware(req);
  const requester = "user" in auth ? (auth as any).user : null;

  try {
    const postId = params.post_id;
    // Start a transaction
    await pool.query("BEGIN");

    // Remove the like relationship and check if a row was deleted
    const deleteResult = await pool.query(
      `DELETE FROM likes WHERE user_id = $1 AND post_id = $2 RETURNING *`,
      [requester.id, postId]
    );

    // If a like was deleted, decrement the post's like count
    if (deleteResult.rowCount > 0) {
      await pool.query(
        `UPDATE posts SET like_count = like_count - 1 WHERE id = $1`,
        [postId]
      );
    }

    // Commit the transaction
    await pool.query("COMMIT");

    return NextResponse.json({ message: "Post unliked" }, { status: 200 });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("DELETE /api/posts/[post_id]/like error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
