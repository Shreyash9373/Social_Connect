// app/dashboard/layout.tsx
import { Sidebar } from "@/components/layout/sidebar";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface AuthUser {
  id: string;
  username: string;
  role: "user" | "admin";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ cookies() is synchronous
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  let userRole: "user" | "admin" = "user"; // default fallback

  if (token) {
    try {
      const decoded = jwt.decode(token) as AuthUser;
      if (decoded?.role === "admin") {
        userRole = "admin";
      }
    } catch (e) {
      console.error("Failed to decode token:", e);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userRole} />
      <main className="flex-1 bg-gray-50 pb-20 md:ml-64 sm:pb-4">
        {children}
      </main>
    </div>
  );
}
