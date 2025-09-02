import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authMiddleware } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// POST /api/users/[user_id]/follow/
// Allows a user to follow another user.
import { supabaseServer } from "@/lib/supabaseServer"; // service role client

// POST /api/users/[user_id]/follow/
export async function POST(
  req: NextRequest,
  { params }: any
) //  context: { params: { user_id: string } }
{
  //  const { params } = context;
  const auth = await authMiddleware(req);
  const requester = "user" in auth ? (auth as any).user : null;

  try {
    const userIdToFollow = params.user_id;

    if (requester.id === userIdToFollow) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Insert follow relationship
    const result = await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING
       RETURNING *`,
      [requester.id, userIdToFollow]
    );

    // ✅ Only notify if it was a new follow
    if (result.rowCount > 0) {
      await supabaseServer.from("notifications").insert({
        recipient: userIdToFollow,
        sender: requester.id,
        notification_type: "follow",
        message: `${requester.username} started following you`,
      });
    }

    return NextResponse.json({ message: "Follow successful" }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/users/[user_id]/follow/ error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[user_id]/follow/
// Allows a user to unfollow another user.
export async function DELETE(
  req: NextRequest,
  { params }: any
) // context: { params: { user_id: string } }
{
  // const { params } = context; // destructure params from context

  const auth = await authMiddleware(req); // user can be null for public view
  const requester = "user" in auth ? (auth as any).user : null;

  try {
    const userIdToUnfollow = params.user_id;

    await pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [requester.id, userIdToUnfollow]
    );

    return NextResponse.json(
      { message: "Unfollow successful" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/users/[user_id]/follow/ error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
