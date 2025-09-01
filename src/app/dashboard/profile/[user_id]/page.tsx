"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import PostModal from "@/components/posts/PostModal";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  is_following: boolean;
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
  const params = useParams();
  const userId = params.user_id as string;

  const [myProfile, setMyProfile] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<
    UserProfile["posts"][0] | null
  >(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        // Fetch the current user's ID
        const myRes = await api.get("/api/me");
        setMyProfile(myRes.data.user);

        // Fetch the target user's profile
        const res = await api.get(`/api/users/${userId}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      await api.post(`/api/users/${userId}/follow`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: true,
              stats: { ...prev.stats, followers: prev.stats.followers + 1 },
            }
          : null
      );
    } catch (err) {
      console.error("Failed to follow:", err);
      toast.error("Failed to follow user.");
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    try {
      await api.delete(`/api/users/${userId}/follow`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: false,
              stats: { ...prev.stats, followers: prev.stats.followers - 1 },
            }
          : null
      );
    } catch (err) {
      console.error("Failed to unfollow:", err);
      toast.error("Failed to unfollow user.");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading profile...</p>;
  if (!profile) return <p className="text-center mt-10">Profile not found</p>;

  // Check if the current user is viewing their own profile
  const isMyProfile = myProfile?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex items-center gap-10 mb-8">
        <img
          src={profile.avatar_url || "/avatar-default.jpg"}
          alt="avatar"
          className="w-28 h-28 rounded-full border"
        />

        <div className="flex-1">
          {/* Username + Follow/Edit button */}
          <div className="flex items-center gap-4 mb-3">
            <h2 className="text-2xl font-semibold">{profile.username}</h2>
            {isMyProfile ? (
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = "/dashboard/edit-profile")
                }
              >
                Edit Profile
              </Button>
            ) : profile.is_following ? (
              <Button onClick={handleUnfollow}>Unfollow</Button>
            ) : (
              <Button onClick={handleFollow}>Follow</Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-3">
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
          <div>
            {profile.bio && (
              <p className="whitespace-pre-line">{profile.bio}</p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm"
              >
                {profile.website}
              </a>
            )}
            {profile.location && (
              <p className="text-sm text-gray-500">{profile.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-2">
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
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm transition">
                {post.content}
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-3 text-center text-gray-500 mt-6">
            No posts yet
          </p>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && myProfile && (
        <PostModal
          post={selectedPost}
          currentUserId={myProfile.id}
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
