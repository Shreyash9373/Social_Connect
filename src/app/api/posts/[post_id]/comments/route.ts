import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/posts/[post_id]/comments/
// Get all active comments for a post.
export async function GET(
  req: NextRequest,
  { params }: any
) //{ params }: { params: { post_id: string } }
{
  const postId = params.post_id;

  try {
    const comments = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.id as user_id, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 AND c.is_active = TRUE
       ORDER BY c.created_at ASC`,
      [postId]
    );
    return NextResponse.json(comments.rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/posts/[post_id]/comments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/posts/[post_id]/comments/
// Add a new comment to a post.
import { supabaseServer } from "@/lib/supabaseServer"; // service role client

export async function POST(
  req: NextRequest,
  context: { params: { post_id: string } }
) {
  const { params } = context;
  const auth = await authMiddleware(req);
  const requester = "user" in auth ? (auth as any).user : null;
  const postId = params.post_id;

  try {
    const { content } = await req.json();

    if (!content || content.length > 200) {
      return NextResponse.json(
        {
          error:
            "Comment content is required and cannot exceed 200 characters.",
        },
        { status: 400 }
      );
    }

    // Start a transaction
    await pool.query("BEGIN");

    // Insert the new comment
    const commentResult = await pool.query(
      `INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING id`,
      [requester.id, postId, content]
    );

    // Increment the post's comment count
    await pool.query(
      `UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1`,
      [postId]
    );

    // ✅ Fetch post author to know who should receive the notification
    const postAuthorRes = await pool.query(
      `SELECT user_id FROM posts WHERE id = $1`,
      [postId]
    );
    const postAuthorId = postAuthorRes.rows[0]?.user_id;

    // ✅ Create notification in Supabase (skip if author comments on their own post)
    if (postAuthorId && postAuthorId !== requester.id) {
      await supabaseServer.from("notifications").insert({
        recipient: postAuthorId,
        sender: requester.id,
        notification_type: "comment",
        post: postId,
        message: `${requester.username} commented on your post`,
      });
    }

    // Commit the transaction
    await pool.query("COMMIT");

    const newCommentId = commentResult.rows[0].id;
    return NextResponse.json(
      { id: newCommentId, message: "Comment added" },
      { status: 201 }
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("POST /api/posts/[post_id]/comments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
