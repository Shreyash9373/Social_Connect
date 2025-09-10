"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import PostModal from "@/components/posts/PostModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  stats: {
    followers: number;
    following: number;
    posts: number;
  };
  posts: {
    id: string;
    image_url: string;
    content: string;
    created_at: string;
    like_count: number;
    comment_count: number;
    author: {
      id: string;
      username: string;
      avatar_url?: string;
    };
  }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<
    UserProfile["posts"][0] | null
  >(null);
  const router = useRouter();
  async function fetchProfile() {
    try {
      const res = await api.get("/api/users/me");
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile:", err);
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleModalClose = () => {
    setSelectedPost(null);
    fetchProfile();
  };

  if (loading) return <p className="text-center mt-10">Loading profile...</p>;
  if (!profile) return <p className="text-center mt-10">Profile not found</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
        <img
          src={profile.avatar_url || "/avatar-default.jpg"}
          alt="avatar"
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border mx-auto sm:mx-0"
        />

        <div className="flex-1 text-center sm:text-left">
          {/* Username + Edit button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-3">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-0">
              {profile.username}
            </h2>
            <Button
              variant="outline"
              className="self-center sm:self-auto"
              // onClick={() => (window.location.href = "/dashboard/edit-profile")}
              onClick={() => router.push("/dashboard/edit-profile")}
            >
              Edit Profile
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-6 mb-3 text-sm sm:text-base">
            <span>
              <strong>{profile.stats.posts}</strong> posts
            </span>
            <span>
              <strong>{profile.stats.followers}</strong> followers
            </span>
            <span>
              <strong>{profile.stats.following}</strong> following
            </span>
          </div>

          {/* Bio */}
          <div className="space-y-1 text-sm sm:text-base">
            {profile.bio && (
              <p className="whitespace-pre-line">{profile.bio}</p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                {profile.website}
              </a>
            )}
            {profile.location && (
              <p className="text-gray-500">{profile.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {profile.posts && profile.posts.length > 0 ? (
          profile.posts.map((post) => (
            <div
              key={post.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <img
                src={post.image_url}
                alt={post.content || "Post"}
                className="w-full h-40 sm:h-56 lg:h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs sm:text-sm transition">
                {post.content}
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 mt-6">
            No posts yet
          </p>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          currentUserId={profile.id}
          open={!!selectedPost}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
