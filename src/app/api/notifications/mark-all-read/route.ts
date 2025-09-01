import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const auth = await authMiddleware(req);
  const user = "user" in auth ? (auth as any).user : null;
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient", user.id);

  if (error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });

  return NextResponse.json({ success: true });
}
