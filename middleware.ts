import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  id: string;
  username: string;
  role?: string;
  exp: number;
}

// Define which routes need protection
const protectedRoutes = ["/dashboard", "/profile"];
const adminRoutes = ["/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect specific routes
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isProtected || isAdminRoute) {
    const token = req.cookies.get("accessToken")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      // Expired token → redirect to login
      if (decoded.exp * 1000 < Date.now()) {
        const loginUrl = new URL("/login", req.url);
        return NextResponse.redirect(loginUrl);
      }

      // Admin-only routes
      if (isAdminRoute && decoded.role !== "admin") {
        const dashboardUrl = new URL("/dashboard", req.url);
        return NextResponse.redirect(dashboardUrl);
      }

      // ✅ Allow access
      return NextResponse.next();
    } catch (err) {
      console.error("Invalid token in middleware:", err);
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next(); // Public route → continue
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
};
