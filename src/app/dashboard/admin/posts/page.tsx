"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: string;
  author_id: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPosts() {
    try {
      const res = await api.get("/api/admin/posts");
      setPosts(res.data.posts);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/api/admin/posts/${postId}`);
      toast.success("Post deleted successfully");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete post");
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Loading posts...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Posts</h1>

      {posts.length === 0 ? (
        <p className="text-gray-500">No posts found</p>
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-[700px] w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left">
                    Author
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left">
                    Content
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center">
                    Likes
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center">
                    Comments
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center">
                    Created
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">
                      {post.author}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 max-w-xs truncate">
                      {post.content || (
                        <span className="text-gray-400 italic">No content</span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      {post.like_count}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      {post.comment_count}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:hidden">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border rounded-lg p-4 shadow-sm bg-white"
              >
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Author:</strong> {post.author}
                </p>
                <p className="text-sm mb-2">
                  <strong>Content:</strong>{" "}
                  {post.content || (
                    <span className="text-gray-400 italic">No content</span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Likes:</strong> {post.like_count} |{" "}
                  <strong>Comments:</strong> {post.comment_count}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
