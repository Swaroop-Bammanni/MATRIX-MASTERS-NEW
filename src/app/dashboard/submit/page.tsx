"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Water & Sanitation",
  "Urban Infrastructure",
  "Healthcare",
  "Education",
  "Agriculture",
  "Environment",
  "Public Safety",
  "Energy",
  "Other",
];

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>("");
  const [affected, setAffected] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (description.trim().length < 20) {
      setError("Description must be at least 20 characters");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in first");
        setLoading(false);
        return;
      }

      let imageUrl = "";

      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const fileName = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("challenges")
          .upload(fileName, imageFile);

        if (uploadErr) {
          console.error("Image upload failed, continuing without image:", uploadErr.message);
        } else {
          const { data: urlData } = supabase.storage
            .from("challenges")
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // Include category and affected in payload
      const { data: challenge, error: dbErr } = await supabase
        .from("challenges")
        .insert({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          category: category || null,
          affected: affected.trim() || null,
          image_url: imageUrl,
          status: "submitted",
          submitted_by: user.id,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

     // Trigger AI analysis
     try {
      await fetch(`/api/challenges/${challenge.id}/analyze`, {
        method: "POST",
      });
    } catch {
      console.log("AI analysis will run later");
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(`/dashboard/challenge/${challenge.id}`);
    }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-8 text-center">
            <p className="text-xl font-bold text-green-800">
              Challenge Submitted!
            </p>
            <p className="text-green-600 mt-2">
              Redirecting to your challenge...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Report a Societal Challenge</CardTitle>
          <p className="text-sm text-slate-500">
            Describe the problem in your own words.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Road flooding near Government School"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the problem. Who is affected? How often? What has been tried?"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-slate-400">
                {description.length} characters (minimum 20)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g., Bhopal, Madhya Pradesh"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
  value={category}
  onValueChange={(val) => setCategory(String(val))}
>
                  <SelectTrigger type="button">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Who is affected?</Label>
              <Input
                placeholder="e.g., School children, residents (~1200 people)"
                value={affected}
                onChange={(e) => setAffected(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo Evidence (optional, max 5MB)</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImage}
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border mt-2"
                />
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Challenge"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}