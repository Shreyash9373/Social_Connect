"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Profile {
  username: string;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  profile_visibility: "public" | "private" | "followers_only";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Load profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/api/users/me");
        setProfile(res.data);
      } catch (error) {
        toast.error("Failed to load profile");
      }
    }
    fetchProfile();
  }, []);

  // Avatar upload
  async function handleAvatarUpload() {
    if (!avatarFile) return;

    if (avatarFile.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be less than 2MB");
      return;
    }

    if (!["image/png", "image/jpeg", "image/jpg"].includes(avatarFile.type)) {
      toast.error("Only PNG/JPG images allowed");
      return;
    }

    try {
      setLoading(true);
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `avatar/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatar")
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatar").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Save avatar URL in profile
      await api.put("/api/users/me", { avatar_url: publicUrl });

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));

      toast.success("Avatar updated successfully!");
    } catch (err: any) {
      toast.error("Failed to upload avatar");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Avatar delete
  async function handleAvatarDelete() {
    if (!profile?.avatar_url) return;

    try {
      setLoading(true);

      // Extract file path from URL (after bucket name)
      const path = profile.avatar_url.split("/avatar/")[1];

      if (path) {
        const { error: deleteError } = await supabase.storage
          .from("avatar")
          .remove([path]);

        if (deleteError) throw deleteError;
      }

      // Remove from DB
      await api.put("/api/users/me", { avatar_url: null });

      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
      toast.success("Avatar deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete avatar");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.put("/api/users/me", {
        bio: profile?.bio,
        website: profile?.website,
        location: profile?.location,
        profile_visibility: profile?.profile_visibility,
      });
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  }

  if (!profile) {
    return <p className="text-center mt-10">Loading profile...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-xl shadow bg-white">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* Avatar Preview */}
        <img
          src={profile.avatar_url || "/avatar-default.jpg"}
          alt="avatar"
          className="w-20 h-20 rounded-full border object-cover mx-auto sm:mx-0"
        />

        {/* Upload + Actions */}
        <div className="flex-1 w-full">
          <Input
            type="file"
            accept="image/*"
            className="w-full sm:w-auto"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          />

          <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
            <Button
              onClick={handleAvatarUpload}
              disabled={!avatarFile || loading}
              className="w-full sm:w-auto"
            >
              {loading
                ? "Uploading..."
                : profile.avatar_url
                ? "Edit Avatar"
                : "Upload Avatar"}
            </Button>

            {profile.avatar_url && (
              <Button
                variant="destructive"
                type="button"
                onClick={handleAvatarDelete}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Delete Avatar
              </Button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-4">
        <Textarea
          placeholder="Bio (max 160 chars)"
          value={profile.bio || ""}
          onChange={(e) =>
            setProfile({ ...profile, bio: e.target.value.slice(0, 160) })
          }
        />
        <Input
          placeholder="Website"
          value={profile.website || ""}
          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
        />
        <Input
          placeholder="Location"
          value={profile.location || ""}
          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
        />

        {/* ✅ Profile visibility dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Profile Visibility
          </label>
          <select
            value={profile.profile_visibility}
            onChange={(e) =>
              setProfile({
                ...profile,
                profile_visibility: e.target.value as
                  | "public"
                  | "private"
                  | "followers_only",
              })
            }
            className="border rounded p-2 w-full"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="followers_only">Followers Only</option>
          </select>
        </div>

        <Button type="submit">Save Profile</Button>
      </form>
    </div>
  );
}
