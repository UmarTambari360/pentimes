"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import {
  UPDATE_PROFILE_MUTATION,
  CHANGE_PASSWORD_MUTATION,
} from "@/lib/graphql/queries/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { Separator } from "@/components/ui/separator";
import type { UserType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

const ProfileSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
});

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Include uppercase, lowercase, and number",
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ProfileFormProps {
  user: UserType;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const getAuthClient = () => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("access_token="))
      ?.split("=")[1];
    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? "",
      avatar: user.avatar ?? "",
    },
  });

  const {
    register: regPw,
    handleSubmit: handlePwSubmit,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm<z.infer<typeof PasswordSchema>>({
    resolver: zodResolver(PasswordSchema),
  });

  const onProfileSubmit = async (data: z.infer<typeof ProfileSchema>) => {
    setSaving(true);
    try {
      const client = getAuthClient();
      await client.request(UPDATE_PROFILE_MUTATION, {
        input: {
          name: data.name,
          bio: data.bio || null,
          avatar: data.avatar || null,
        },
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof PasswordSchema>) => {
    setPasswordSaving(true);
    try {
      const client = getAuthClient();
      await client.request(CHANGE_PASSWORD_MUTATION, {
        input: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        },
      });
      toast.success("Password changed successfully!");
      resetPw();
    } catch {
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const token =
          document.cookie
            .split("; ")
            .find((r) => r.startsWith("access_token="))
            ?.split("=")[1] ?? "";
        const response = await fetch(`${API_URL}/upload/avatar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image: `data:${file.type};base64,${base64}` }),
        });
        if (!response.ok) throw new Error();
        const { url } = (await response.json()) as { url: string };
        setValue("avatar", url);
        setAvatarPreview(url);
        toast.success("Avatar updated!");
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile form */}
      <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-5">
        <h2 className="font-serif font-semibold text-body">
          Personal Information
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <AuthorAvatar
              author={{
                id: user.id,
                name: user.name,
                avatar: avatarPreview ?? null,
              }}
              size="lg"
            />
            <label className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-600 text-ink-900 rounded-full p-1.5 cursor-pointer transition-colors shadow-md">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="sr-only"
              />
              {avatarUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </label>
          </div>
          <div>
            <p className="text-body-sm font-semibold">{user.name}</p>
            <p className="text-caption text-muted-foreground capitalize">
              {user.role} · {user.email}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-caption text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={3}
            placeholder="Tell readers about yourself…"
            maxLength={500}
            {...register("bio")}
          />
        </div>

        <Button type="submit" variant="amber" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </form>

      <Separator />

      {/* Password form */}
      <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="space-y-5">
        <h2 className="font-serif font-semibold text-body">Change Password</h2>

        <div className="space-y-1.5">
          <Label>Current Password</Label>
          <Input
            type="password"
            {...regPw("currentPassword")}
            className={pwErrors.currentPassword ? "border-destructive" : ""}
          />
          {pwErrors.currentPassword && (
            <p className="text-caption text-destructive">
              {pwErrors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>New Password</Label>
          <Input
            type="password"
            {...regPw("newPassword")}
            className={pwErrors.newPassword ? "border-destructive" : ""}
          />
          {pwErrors.newPassword && (
            <p className="text-caption text-destructive">
              {pwErrors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Confirm New Password</Label>
          <Input
            type="password"
            {...regPw("confirmPassword")}
            className={pwErrors.confirmPassword ? "border-destructive" : ""}
          />
          {pwErrors.confirmPassword && (
            <p className="text-caption text-destructive">
              {pwErrors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" variant="outline" disabled={passwordSaving}>
          {passwordSaving ? "Changing…" : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
