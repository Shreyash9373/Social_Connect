import { z } from "zod";

// -------------------------
// Register Schema
// -------------------------
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password cannot exceed 50 characters"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

// -------------------------
// Login Schema
// -------------------------
export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// -------------------------
// Password Reset (Request)
// -------------------------
export const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// -------------------------
// Password Reset Confirm
// -------------------------
export const passwordResetConfirmSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password cannot exceed 50 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// -------------------------
// Change Password (Auth)
// -------------------------
export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(6, "Old password must be at least 6 characters"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password cannot exceed 50 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export const postCreateSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(280, "Max 280 characters"),
  image_url: z.string().url().optional().nullable(),
  category: z.enum(["general", "announcement", "question"]).default("general"),
});

export const postUpdateSchema = z.object({
  content: z.string().min(1).max(280).optional(),
  image_url: z.string().url().nullable().optional(),
  category: z.enum(["general", "announcement", "question"]).optional(),
  is_active: z.boolean().optional(),
});
