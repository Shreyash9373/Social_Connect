"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  sender: { id: string; username: string; avatar_url?: string };
  message: string;
  notification_type: "follow" | "like" | "comment";
  post?: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notifications
  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.get("/api/notifications");
        setNotifications(res.data.notifications || []);
        // Mark all as read automatically when visiting
        await api.post("/api/notifications/mark-all-read");
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!notifications.length) {
    return (
      <div className="text-center mt-20 text-gray-500">
        <Bell className="w-10 h-10 mx-auto mb-2" />
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await api.post("/api/notifications/mark-all-read");
            setNotifications((prev) =>
              prev.map((n) => ({ ...n, is_read: true }))
            );
          }}
        >
          Mark all as read
        </Button>
      </div>

      <div className="divide-y rounded-lg border bg-white">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-center gap-3 p-3 ${
              !n.is_read ? "bg-gray-100" : ""
            }`}
          >
            {/* <img
              src={n.sender.avatar_url || "/default-avatar.png"}
              alt={n.sender.username}
              className="w-8 h-8 rounded-full"
            /> */}

            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{n.sender.username}</span>{" "}
                {n.message}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>

            {!n.is_read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
