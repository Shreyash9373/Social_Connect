"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  role: string;
  created_at: string;
  last_login: string | null;
  bio?: string;
  avatar_url?: string;
  website?: string;
  location?: string;
}

export default function UserDetailPage() {
  const { user_id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    try {
      const res = await api.get(`/api/admin/users/${user_id}`);
      setUser(res.data);
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading user...</p>;
  if (!user) return <p className="text-center mt-10">User not found</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Details</h1>

      <div className="border rounded-lg p-6 bg-white shadow">
        <img
          src={user.avatar_url || "/avatar-default.jpg"}
          alt="Avatar"
          className="w-20 h-20 rounded-full mb-4"
        />
        <h2 className="text-xl font-semibold">{user.username}</h2>
        <p className="text-gray-600">{user.email}</p>
        <p className="text-sm">Role: {user.role}</p>
        <p className="text-sm">
          Status:{" "}
          <span className={user.is_active ? "text-green-600" : "text-red-600"}>
            {user.is_active ? "Active" : "Inactive"}
          </span>
        </p>
        <p className="text-sm">
          Joined: {new Date(user.created_at).toDateString()}
        </p>
        {user.last_login && (
          <p className="text-sm">
            Last login: {new Date(user.last_login).toLocaleString()}
          </p>
        )}
        {user.bio && <p className="mt-2">{user.bio}</p>}
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm"
          >
            {user.website}
          </a>
        )}
        {user.location && <p className="text-sm">{user.location}</p>}
      </div>
    </div>
  );
}
