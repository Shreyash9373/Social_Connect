"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  username: string;
  avatar_url?: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.get("/api/get-users");
        setUsers(res.data.users);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading users...</p>;

  if (!users.length) {
    return (
      <p className="text-center mt-10 text-gray-500">No users available.</p>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="border rounded-lg shadow-sm p-4 flex flex-col items-center text-center bg-white"
          >
            <img
              src={user.avatar_url || "/avatar-default.jpg"}
              alt={user.username}
              className="w-16 h-16 rounded-full mb-3"
            />
            <h2 className="font-semibold text-lg">{user.username}</h2>
            <Button
              className="mt-3"
              onClick={() => router.push(`/dashboard/profile/${user.id}`)}
            >
              View
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
