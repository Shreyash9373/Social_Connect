// /app/api/admin/posts/[post_id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";
import pool from "@/lib/db"; // Import the shared pool instance

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function DELETE(
  req: NextRequest,
  //context: { params: { post_id: string } }
  { params }: any
) {
  //  const { params } = context; // ✅ safely extract params
  const auth = await authMiddleware(req, ["admin"]);

  try {
    const result = await pool.query(
      `DELETE FROM posts WHERE id = $1 RETURNING id, content, image_url`,
      [params.post_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Post deleted", post: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/admin/posts/[post_id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
