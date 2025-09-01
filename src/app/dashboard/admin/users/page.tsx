"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchUsers() {
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function toggleUserStatus(userId: string, isActive: boolean) {
    try {
      await api.post(`/api/admin/users/${userId}/deactivate`, {
        is_active: !isActive,
      });
      toast.success(
        `User ${isActive ? "deactivated" : "activated"} successfully`
      );
      fetchUsers();
    } catch {
      toast.error("Failed to update user status");
    }
  }

  if (loading) {
    return <p className="text-center mt-10">Loading users...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>

      {users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="shadow-md">
              <CardHeader>
                <CardTitle>{user.username}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500">Role: {user.role}</p>
                <p
                  className={`text-xs font-semibold mt-1 ${
                    user.is_active ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {user.is_active ? "Active" : "Inactive"}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/admin/users/${user.id}`)
                    }
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant={user.is_active ? "destructive" : "default"}
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
