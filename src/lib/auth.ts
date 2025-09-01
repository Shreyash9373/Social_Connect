import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthUser {
  id: string;
  username: string;
  role: "user" | "admin";
}

/**
 * Middleware to protect routes and optionally enforce role-based access
 * @param req - NextRequest
 * @param allowedRoles - array of roles that are allowed (default: all)
 */
export async function authMiddleware(
  req: NextRequest,
  allowedRoles: ("user" | "admin")[] = ["user", "admin"]
): Promise<{ user: AuthUser } | NextResponse> {
  try {
    // ✅ Read token from cookies
    const token = req.cookies.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = decoded as AuthUser;

    // ✅ Role check
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient role" },
        { status: 403 }
      );
    }

    return { user };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
