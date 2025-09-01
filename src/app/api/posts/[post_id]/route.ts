import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { postUpdateSchema } from "@/lib/validator";
import { authMiddleware } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient"; // ✅ import supabase client

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/posts/:post_id
export async function GET(
  req: NextRequest,
  { params }: { params: { post_id: string } }
) {
  try {
    const res = await pool.query(
      `SELECT p.id, p.user_id AS author_id, p.content, p.image_url, p.category,
              p.like_count, p.comment_count, p.created_at, u.username, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [params.post_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: res.rows[0] });
  } catch (error) {
    console.error("GET /api/posts/:id error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/:post_id → update own post
export async function PATCH(
  req: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const auth = await authMiddleware(req);
  if ("user" in auth === false) return auth;
  const { user } = auth as any;

  try {
    const body = await req.json();
    const parsed = postUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    // Check ownership
    const ownerRes = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [params.post_id]
    );
    if (ownerRes.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (ownerRes.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build dynamic update query
    const updates = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, val] of Object.entries(parsed.data)) {
      updates.push(`${key} = $${i++}`);
      values.push(val);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    values.push(params.post_id);

    const q = `
      UPDATE posts
      SET ${updates.join(", ")}, updated_at = now()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(q, values);
    return NextResponse.json({ post: result.rows[0] });
  } catch (error) {
    console.error("PATCH /api/posts/:id error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/:post_id → delete own post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const auth = await authMiddleware(req);
  if ("user" in auth === false) return auth;
  const { user } = auth as any;

  try {
    // Check if post exists and belongs to user
    const res = await pool.query(
      "SELECT user_id, image_url FROM posts WHERE id = $1",
      [params.post_id]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (res.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const imageUrl = res.rows[0].image_url;

    // ✅ Delete post record
    await pool.query("DELETE FROM posts WHERE id = $1", [params.post_id]);

    // ✅ If post had an image, delete it from Supabase storage
    if (imageUrl) {
      try {
        // extract path from public URL
        const url = new URL(imageUrl);
        const path = url.pathname.split("/object/public/")[1]; // e.g. "post-images/xyz.png"

        if (path) {
          const { error } = await supabase.storage
            .from("post-images")
            .remove([path]);
          if (error) {
            console.error("Supabase image deletion failed:", error.message);
          }
        }
      } catch (e) {
        console.error("Error parsing image URL:", e);
      }
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/posts/:id error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
