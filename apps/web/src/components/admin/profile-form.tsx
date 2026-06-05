"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "../public/image-upload";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/session";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

const ProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name cannot exceed 120 characters")
    .trim(),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .trim()
    .optional(),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must include uppercase, lowercase, and a number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ProfileFormProps {
  user: SessionUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
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
    watch,
    formState: { errors, isSubmitting: profileSubmitting },
  } = useForm({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? "",
      avatar: user.avatar ?? "",
    },
  });

  const watchAvatar = watch("avatar");

  const {
    register: regPw,
    handleSubmit: handlePwSubmit,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<z.infer<typeof PasswordSchema>>({
    resolver: zodResolver(PasswordSchema),
  });

  const onProfileSubmit = async (data: z.infer<typeof ProfileSchema>) => {
    const promise = async () => {
      const client = getAuthClient();
      await client.request(UPDATE_PROFILE_MUTATION, {
        input: {
          name: data.name,
          bio: data.bio || null,
          avatar: data.avatar || null,
        },
      });
    };
    toast.promise(promise(), {
      loading: "Saving profile…",
      success: "Profile updated successfully!",
      error: (err) =>
        err instanceof Error ? err.message : "Failed to update profile.",
    });
  };

  const onPasswordSubmit = async (data: z.infer<typeof PasswordSchema>) => {
    const promise = async () => {
      const client = getAuthClient();
      await client.request(CHANGE_PASSWORD_MUTATION, {
        input: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        },
      });
      resetPw();
    };
    toast.promise(promise(), {
      loading: "Changing password…",
      success: "Password changed successfully!",
      error: (err) => {
        const msg =
          err instanceof Error ? err.message : "Failed to change password.";
        return msg.replace("GraphQL Error: ", "");
      },
    });
  };

  const roleVariant: Record<
    string,
    "default" | "amber" | "success" | "published"
  > = {
    reader: "default",
    author: "amber",
    admin: "success",
  };

  return (
    <div className="space-y-10">
      {/* ── Profile section ── */}
      <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-serif font-bold text-headline">
            Personal Information
          </h2>
        </div>

        {/* Avatar + account info */}
        <div className="flex items-start gap-6 p-5 rounded-xl bg-muted/30 border border-border">
          {/* Avatar with upload button */}
          <div className="relative shrink-0">
            <AuthorAvatar
              author={{
                id: user.id,
                name: user.name,
                avatar: watchAvatar,
              }}
              size="lg"
            />
            <div className="absolute -bottom-1 -right-1">
              <ImageUpload
                endpoint="avatar"
                value={watchAvatar}
                onChange={(url) => setValue("avatar", url || "")}
                aspectRatio="square"
                className="w-7 h-7 rounded-full overflow-hidden [&>div]:!aspect-square [&>div]:!h-7 [&>div]:!w-7"
                placeholder=""
              />
            </div>
          </div>

          {/* Account details */}
          <div className="min-w-0">
            <p className="font-semibold text-body truncate">{user.name}</p>
            <p className="text-body-sm text-muted-foreground truncate">
              {user.email}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge
                variant={roleVariant[user.role] ?? "default"}
                className="capitalize"
              >
                {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                {user.role}
              </Badge>
              <span className="text-caption text-muted-foreground">
                Member since{" "}
                {new Date(user.createdAt).toLocaleDateString("en-NG", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="font-semibold">
            Display Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Your full name"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-caption text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className="font-semibold">
            Bio
            <span className="ml-1.5 text-caption text-muted-foreground font-normal">
              (shown on your articles — max 500 chars)
            </span>
          </Label>
          <Textarea
            id="bio"
            rows={4}
            placeholder="Tell readers about yourself — your background, expertise, and what you write about…"
            maxLength={500}
            className="resize-none"
            {...register("bio")}
          />
          <div className="flex justify-between">
            {errors.bio && (
              <p className="text-caption text-destructive">
                {errors.bio.message}
              </p>
            )}
            <span className="text-caption text-muted-foreground ml-auto">
              {watch("bio")?.length ?? 0}/500
            </span>
          </div>
        </div>

        <Button
          type="submit"
          variant="amber"
          disabled={profileSubmitting}
          className="gap-2"
        >
          {profileSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {profileSubmitting ? "Saving…" : "Save Profile"}
        </Button>
      </form>

      <Separator />

      {/* ── Password section ── */}
      <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="space-y-6">
        <div>
          <h2 className="font-serif font-bold text-headline mb-1">
            Change Password
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Use a strong password with at least 8 characters, including
            uppercase, lowercase, and a number.
          </p>
        </div>

        {/* Current password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="font-semibold">
            Current Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Your current password"
            {...regPw("currentPassword")}
            className={pwErrors.currentPassword ? "border-destructive" : ""}
          />
          {pwErrors.currentPassword && (
            <p className="text-caption text-destructive">
              {pwErrors.currentPassword.message}
            </p>
          )}
        </div>

        {/* New password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="font-semibold">
            New Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...regPw("newPassword")}
            className={pwErrors.newPassword ? "border-destructive" : ""}
          />
          {pwErrors.newPassword && (
            <p className="text-caption text-destructive">
              {pwErrors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-semibold">
            Confirm New Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            {...regPw("confirmPassword")}
            className={pwErrors.confirmPassword ? "border-destructive" : ""}
          />
          {pwErrors.confirmPassword && (
            <p className="text-caption text-destructive">
              {pwErrors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="outline"
          disabled={pwSubmitting}
          className="gap-2"
        >
          {pwSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {pwSubmitting ? "Changing…" : "Change Password"}
        </Button>
      </form>

      <Separator />

      {/* ── Danger zone ── */}
      <div className="space-y-4">
        <h2 className="font-serif font-bold text-headline">Account</h2>
        <div className="p-4 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-sm font-semibold">Email Address</p>
              <p className="text-caption text-muted-foreground">{user.email}</p>
              <p className="text-caption text-muted-foreground mt-1">
                To change your email, please contact an administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
