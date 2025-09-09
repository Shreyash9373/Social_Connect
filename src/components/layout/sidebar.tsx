"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import {
  Bell,
  Home,
  PlusSquare,
  User,
  LayoutGrid,
  LogOut,
  UserCircle,
  FileText,
  BarChart3,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // anon client
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
interface SidebarProps {
  userRole: "user" | "admin";
}
interface User {
  id: string;
  username: string;
  role?: string;
}
export function Sidebar({ userRole }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch {
      toast.error("Logout failed. Try again.");
    }
  };

  // 🔹 Load initial unread count
  useEffect(() => {
    async function loadCount() {
      try {
        const res = await api.get("/api/notifications");
        const unread = res.data.notifications.filter(
          (n: any) => !n.is_read
        ).length;
        setCount(unread);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    async function fetchUser() {
      try {
        const res = await api.get("/api/me");
        setUser(res.data.user); // 👈 you now have userId, username, role
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }
    loadCount();
    fetchUser();
  }, []);
  useEffect(() => {
    if (pathname.startsWith("/dashboard/notifications")) {
      setCount(0);
    }
  }, [pathname]);
  // 🔹 Real-time subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient=eq.${user.id}`,
        },
        () => {
          setCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // 🔹 User nav items
  const userNavItems = [
    // { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/posts/create", label: "Create", icon: PlusSquare },
    { href: "/dashboard/feed", label: "Feed", icon: LayoutGrid },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/users", label: "Users", icon: UserCircle },
  ];

  // 🔹 Admin nav items
  const adminNavItems = [
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/posts", label: "Posts", icon: FileText },
    { href: "/dashboard/admin/stats", label: "Stats", icon: BarChart3 },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 min-h-screen bg-gray-800 text-white p-6 fixed ">
        <h2 className="text-xl font-bold mb-6">Social Connect</h2>
        <nav className="space-y-4">
          {userRole === "user" &&
            userNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 transition-colors",
                    active && "bg-gray-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.label === "Notifications" && count > 0 && (
                    <span className="absolute -top-1 left-5 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}

          {userRole === "admin" &&
            adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 transition-colors",
                    active && "bg-gray-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

          <div className="border-t border-gray-700 my-4" />
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="flex items-center gap-3 text-red-400 hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </nav>
      </aside>

      {/* Mobile Bottom Nav for Users */}
      {userRole === "user" && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white flex justify-around items-center py-2 md:hidden z-50">
          {userNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2",
                  active ? "text-blue-400" : "text-gray-400"
                )}
              >
                <Icon className="w-6 h-6" />
                {item.label === "Notifications" && count > 0 && (
                  <span className="absolute top-0 right-3 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center p-2 text-gray-400 hover:text-red-500"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </nav>
      )}

      {/* Mobile Bottom Nav for Admins */}
      {userRole === "admin" && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white flex justify-around items-center py-2 md:hidden z-50">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2",
                  active ? "text-blue-400" : "text-gray-400"
                )}
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center p-2 text-gray-400 hover:text-red-500"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </nav>
      )}
    </>
  );
}
