import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { postCreateSchema } from "@/lib/validator";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// POST /api/posts → create new post
export async function POST(req: NextRequest) {
  const auth = await authMiddleware(req);
  if ("user" in auth === false) return auth;
  const { user } = auth as any;

  try {
    const body = await req.json();
    const parsed = postCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { content, image_url, category } = parsed.data;

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, image_url, category)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id AS author_id, content, image_url, category, created_at, updated_at`,
      [user.id, content, image_url ?? null, category]
    );

    return NextResponse.json({ post: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET /api/posts?limit=10&page=1&authorId=&category=
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 10), 50);
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const offset = (page - 1) * limit;

  const authorId = url.searchParams.get("authorId");
  const category = url.searchParams.get("category");

  try {
    let where = "WHERE is_active = true";
    const values: any[] = [];

    if (authorId) {
      values.push(authorId);
      where += ` AND user_id = $${values.length}`;
    }
    if (category) {
      values.push(category);
      where += ` AND category = $${values.length}`;
    }

    const query = `
      SELECT id, user_id AS author_id, content, image_url, category,
             like_count, comment_count, created_at
      FROM posts
      ${where}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    return NextResponse.json({ posts: result.rows, page, limit });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
