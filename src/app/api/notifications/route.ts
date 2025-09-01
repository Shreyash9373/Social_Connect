import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req);
  const user = "user" in auth ? (auth as any).user : null;
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({ notifications: data });
}
