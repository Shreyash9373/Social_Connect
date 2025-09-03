"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

// Custom function to format time elapsed
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = Date.now();
  const seconds = Math.floor((now - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return "just now";
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url?: string;
}

interface PostModalProps {
  post: {
    id: string;
    image_url: string;
    content: string;
    like_count: number;
    comment_count: number;
    author: { id: string; username: string; avatar_url?: string };
    created_at: string;
  };
  currentUserId: string;
  open: boolean;
  onClose: () => void;
}

export default function PostModal({
  post,
  currentUserId,
  open,
  onClose,
}: PostModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [caption, setCaption] = useState(post.content);
  const [loading, setLoading] = useState(false);

  // Like & Comment State
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // Fetch like status and comments when the modal opens
  useEffect(() => {
    if (open) {
      async function fetchPostData() {
        try {
          const [likeRes, commentsRes] = await Promise.all([
            api.get(`/api/posts/${post.id}/like`),
            api.get(`/api/posts/${post.id}/comments`),
          ]);
          setIsLiked(likeRes.data.isLiked);
          setLikeCount(likeRes.data.likeCount);
          setComments(commentsRes.data);
        } catch (err) {
          console.error("Failed to fetch post data:", err);
          toast.error("Failed to load post data.");
        }
      }
      fetchPostData();
    }
  }, [open, post.id]);

  // Handle Liking a Post
  const handleLike = async () => {
    try {
      const newStatus = !isLiked;
      setIsLiked(newStatus);
      setLikeCount((prev) => (newStatus ? prev + 1 : prev - 1));

      if (newStatus) {
        await api.post(`/api/posts/${post.id}/like`);
      } else {
        await api.delete(`/api/posts/${post.id}/like`);
      }
    } catch {
      toast.error("Failed to update like status.");
      setIsLiked(!isLiked); // Revert state on error
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  // Handle Commenting on a Post
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setIsCommenting(true);
      const res = await api.post(`/api/posts/${post.id}/comments`, {
        content: newComment,
      });

      // Optimistically add the new comment to the state
      const tempComment = {
        id: res.data.id,
        content: newComment,
        created_at: new Date().toISOString(),
        user_id: currentUserId,
        username: post.author.username,
        avatar_url: post.author.avatar_url,
      };
      setComments((prev) => [...prev, tempComment]);
      setNewComment("");
      toast.success("Comment added!");
    } catch {
      toast.error("Failed to add comment.");
    } finally {
      setIsCommenting(false);
    }
  };

  // Handle Deleting a Comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/api/posts/${post.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted!");
    } catch {
      toast.error("Failed to delete comment.");
    }
  };

  // Delete Post
  async function handleDeletePost() {
    try {
      await api.delete(`/api/posts/${post.id}`);
      toast.success("Post deleted!");
      onClose();
    } catch {
      toast.error("Failed to delete post");
    }
  }

  // Update Caption
  async function handleUpdateCaption() {
    try {
      setLoading(true);
      await api.patch(`/api/posts/${post.id}`, { content: caption });
      toast.success("Post updated!");
      setIsEditing(false);
      setMenuOpen(false);
    } catch {
      toast.error("Failed to update post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 flex flex-col md:flex-row">
        {/* Left: Image */}
        <div className="w-full md:flex-1 bg-black flex items-center justify-center">
          <img
            src={post.image_url}
            alt="post"
            className="w-full h-auto max-h-[50vh] md:max-h-[80vh] object-contain"
          />
        </div>

        {/* Right: Post Info & Comments */}
        <div className="w-full md:w-96 flex flex-col max-h-[60vh] md:max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <div className="flex items-center gap-2">
              <img
                src={post.author.avatar_url || "/avatar-default.jpg"}
                alt={post.author.username}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
              />
              <span className="font-semibold text-sm sm:text-base">
                {post.author.username}
              </span>
            </div>
            {/* 3 dots menu */}
            <div className="relative">
              {post.author.id === currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              )}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-50 text-sm">
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100"
                    onClick={handleDeletePost}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Caption & Comments */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {/* Caption */}
            <div className="flex items-start gap-2">
              <img
                src={post.author.avatar_url || "/avatar-default.jpg"}
                alt={post.author.username}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
              />
              <div className="flex-1">
                <p className="text-sm sm:text-base">
                  <span className="font-semibold">{post.author.username}</span>
                  <span className="ml-2">{post.content}</span>
                </p>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(post.created_at)}
                </span>
              </div>
            </div>

            {/* Comments */}
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <img
                  src={comment.avatar_url || "/avatar-default.jpg"}
                  alt={comment.username}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-sm sm:text-base">
                    <span className="font-semibold">{comment.username}</span>
                    <span className="ml-2">{comment.content}</span>
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                </div>
                {comment.user_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Actions & Comment Form */}
          <div className="p-3 sm:p-4 border-t">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleLike}>
                  <Heart
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      isLiked ? "text-red-500 fill-current" : "text-gray-500"
                    }`}
                  />
                </Button>
                <span className="text-xs sm:text-sm text-gray-500">
                  {likeCount}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (window.location.href = "#comments-section")}
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </Button>
            </div>

            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <Input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm sm:text-base"
                disabled={isCommenting}
              />
              <Button type="submit" size="sm" disabled={isCommenting}>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
