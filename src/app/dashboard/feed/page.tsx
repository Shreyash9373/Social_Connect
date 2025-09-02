"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Heart, MessageCircle, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url?: string;
}

interface FeedPost {
  id: string;
  image_url: string;
  content: string;
  created_at: string;
  author: { id: string; username: string; avatar_url?: string };
  username: string; // <- add if API returns this
  avatar_url?: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [commentVisible, setCommentVisible] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    async function loadFeed() {
      try {
        const res = await api.get("/api/feed?page=1");
        setPosts(res.data.posts || []);
      } catch (err) {
        console.error("Error loading feed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [comments]);

  const toggleLike = async (post: FeedPost) => {
    const isLiked = post.liked_by_me;
    const updatedPosts = posts.map((p) =>
      p.id === post.id
        ? {
            ...p,
            liked_by_me: !isLiked,
            like_count: p.like_count + (isLiked ? -1 : 1),
          }
        : p
    );
    setPosts(updatedPosts);

    try {
      if (isLiked) {
        await api.delete(`/api/posts/${post.id}/like`);
      } else {
        await api.post(`/api/posts/${post.id}/like`);
      }
    } catch {
      toast.error("Failed to update like.");
      // revert state
      setPosts(posts);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const res = await api.get(`/api/posts/${postId}/comments`);
      setComments((prev) => ({ ...prev, [postId]: res.data }));
    } catch {
      toast.error("Failed to load comments.");
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!newComment[postId]?.trim()) return;
    try {
      const res = await api.post(`/api/posts/${postId}/comments`, {
        content: newComment[postId],
      });
      const tempComment: Comment = {
        id: res.data.id,
        content: newComment[postId],
        created_at: new Date().toISOString(),
        user_id: "me", // ideally use currentUserId from context
        username: "You",
      };
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), tempComment],
      }));
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
    } catch {
      toast.error("Failed to add comment.");
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await api.delete(`/api/posts/${postId}/comments/${commentId}`);
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId]?.filter((c) => c.id !== commentId) || [],
      }));

      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment.");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading feed...</p>;

  if (!posts.length) {
    return (
      <div className="text-center mt-20">
        <p className="text-gray-500 text-lg">
          👋 Welcome! Follow some users or upload posts to see your feed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-6 space-y-8">
      {posts.map((post) => (
        <div
          key={post.id}
          className="border rounded-lg shadow bg-white overflow-hidden"
        >
          {/* Author */}
          <div className="flex items-center gap-3 p-3">
            <img
              src={post.avatar_url || "/avatar-default.jpg"}
              alt={post.username}
              className="w-8 h-8 rounded-full"
            />
            <span className="font-semibold">{post.username}</span>
          </div>

          {/* Post Image */}
          <img src={post.image_url} alt="" className="w-full object-cover" />

          {/* Actions */}
          <div className="flex items-center gap-4 px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleLike(post)}
            >
              <Heart
                className={`w-6 h-6 ${
                  post.liked_by_me ? "text-red-500 fill-red-500" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCommentVisible((prev) => ({
                  ...prev,
                  [post.id]: !prev[post.id],
                }));
                if (!comments[post.id]) loadComments(post.id);
              }}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </div>

          {/* Stats */}
          <div className="px-4 text-sm font-medium">
            <p>{post.like_count} likes</p>
            <p>{post.comment_count} comments</p>
          </div>

          {/* Caption */}
          <div className="px-4 py-2">
            <span className="font-semibold">{post.username}</span>{" "}
            {post.content}
          </div>

          {/* Comments Section */}
          {commentVisible[post.id] && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {comments[post.id]?.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <p className="text-sm">
                      <span className="font-semibold">{c.username}</span>{" "}
                      {c.content}
                    </p>
                    {c.user_id === "me" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteComment(post.id, c.id)}
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCommentSubmit(post.id);
                }}
                className="flex gap-2 mt-2"
              >
                <Input
                  type="text"
                  value={newComment[post.id] || ""}
                  onChange={(e) =>
                    setNewComment((prev) => ({
                      ...prev,
                      [post.id]: e.target.value,
                    }))
                  }
                  placeholder="Add a comment..."
                />
                <Button type="submit">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
