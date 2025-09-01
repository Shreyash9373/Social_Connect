"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Only PNG/JPG images allowed");
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `post-images/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      await api.post("/api/posts", {
        content,
        image_url: imageUrl,
        category,
      });

      toast.success("Post created successfully!");
      setContent("");
      setImageFile(null);
      setPreviewUrl(null);
      setCategory("general");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 border rounded-xl shadow bg-white">
      <h2 className="text-xl font-bold mb-4">Create Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="What's on your mind? (max 280 chars)"
          value={content}
          maxLength={280}
          onChange={(e) => setContent(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="general">General</option>
            <option value="announcement">Announcement</option>
            <option value="question">Question</option>
          </select>
        </div>

        <div>
          <Input type="file" accept="image/*" onChange={handleImageChange} />
          {previewUrl && (
            <div className="relative mt-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-md border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImageFile(null);
                  setPreviewUrl(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Create Post"}
        </Button>
      </form>
    </div>
  );
}
