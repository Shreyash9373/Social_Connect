import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authResult = await authMiddleware(req);

  if ("user" in authResult) {
    return NextResponse.json({ user: authResult.user });
  }

  return authResult; // returns 401/403 if unauthorized
}
