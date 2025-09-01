// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { api } from "@/lib/apiClient";

// interface User {
//   id: string;
//   username: string;
//   role: "user" | "admin";
// }

// export default function DashboardPage() {
//   const router = useRouter();
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await api.get("/api/me"); // ✅ fetch from protected API
//         setUser(res.data.user);
//       } catch (err) {
//         toast.error("Session expired. Please log in again.");
//         router.push("/login");
//       }
//     };

//     fetchUser();
//   }, [router]);

//   if (!user) {
//     return <p className="text-center mt-10">Loading dashboard...</p>;
//   }

//   return (
//     <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-xl shadow bg-white">
//       <h1 className="text-2xl font-bold mb-4">Welcome, {user.username} 🎉</h1>
//       <p className="text-gray-700 mb-6">
//         You are logged in with role:{" "}
//         <span className="font-semibold">{user.role}</span>
//       </p>

//       {user.role === "admin" ? (
//         <div className="p-4 border rounded-md bg-gray-50">
//           <h2 className="font-semibold mb-2">Admin Panel</h2>
//           <p className="text-sm text-gray-600">
//             Here you can manage users, settings, etc.
//           </p>
//         </div>
//       ) : (
//         <div className="p-4 border rounded-md bg-gray-50">
//           <h2 className="font-semibold mb-2">User Area</h2>
//           <p className="text-sm text-gray-600">
//             Access your profile, update settings, and explore features.
//           </p>
//         </div>
//       )}

//       <Button
//         className="mt-6"
//         onClick={async () => {
//           try {
//             await api.post("/api/auth/logout"); // ✅ logout clears cookies
//             toast.success("Logged out successfully.");
//             router.push("/login");
//           } catch {
//             toast.error("Logout failed. Try again.");
//           }
//         }}
//       >
//         Logout
//       </Button>
//     </div>
//   );
// }
// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { Sidebar } from "@/components/layout/sidebar"; // ✅ Import the Sidebar component

interface User {
  id: string;
  username: string;
  role: "user" | "admin";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/me");
        setUser(res.data.user);
      } catch (err) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return <p className="text-center mt-10">Loading dashboard...</p>;
  }

  if (!user) {
    // Redirect is handled by useEffect, but this is a fallback.
    return null;
  }

  return (
    <div className="flex">
      {/* ✅ Render the sidebar and pass the user's role */}
      {/* <Sidebar userRole={user.role} /> */}
      <main className="flex-grow p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">
            Welcome, {user.username} 🎉
          </h1>
          <p className="text-gray-700 mb-6">
            You are logged in with role:{" "}
            <span className="font-semibold">{user.role}</span>
          </p>
          {user.role === "admin" ? (
            <div className="p-4 border rounded-md bg-gray-50">
              <h2 className="font-semibold mb-2">Admin Panel</h2>
              <p className="text-sm text-gray-600">
                Here you can manage users, posts, etc.
              </p>
            </div>
          ) : (
            <div className="p-4 border rounded-md bg-gray-50">
              <h2 className="font-semibold mb-2">User Area</h2>
              <p className="text-sm text-gray-600">
                Access your profile, update settings, and explore features.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
