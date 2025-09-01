// src/app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function HomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // No token → go to login
  if (!accessToken) {
    redirect("/login");
  }

  try {
    // Verify token validity
    jwt.verify(accessToken, JWT_SECRET);
    redirect("/dashboard"); // Valid token → dashboard
  } catch {
    redirect("/login"); // Expired/invalid → login
  }

  return null;
}
