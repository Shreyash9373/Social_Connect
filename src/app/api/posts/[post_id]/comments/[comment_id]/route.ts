import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// DELETE /api/comments/[comment_id]/
// Allows a user to delete their own comment.
export async function DELETE(
  req: NextRequest,
  context: { params: { comment_id: string } }
) {
  const { params } = context; // destructure params from context
  const auth = await authMiddleware(req);
  const requester = "user" in auth ? (auth as any).user : null;

  const commentId = params.comment_id;

  try {
    // Start a transaction
    await pool.query("BEGIN");

    // Check if the comment exists and belongs to the requester
    const commentRes = await pool.query(
      `SELECT post_id, user_id FROM comments WHERE id = $1`,
      [commentId]
    );
    const comment = commentRes.rows[0];

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.user_id !== requester.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete the comment
    await pool.query(`UPDATE comments SET is_active = FALSE WHERE id = $1`, [
      commentId,
    ]);

    // Decrement the post's comment count
    await pool.query(
      `UPDATE posts SET comment_count = comment_count - 1 WHERE id = $1`,
      [comment.post_id]
    );

    // Commit the transaction
    await pool.query("COMMIT");

    return NextResponse.json({ message: "Comment deleted" }, { status: 200 });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("DELETE /api/comments/[comment_id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
