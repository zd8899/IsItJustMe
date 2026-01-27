import { z } from "zod";

export const createPostSchema = z.object({
  frustration: z
    .string()
    .min(1, "Please describe your frustration")
    .max(500, "Frustration must be less than 500 characters"),
  identity: z
    .string()
    .min(1, "Please describe who you are")
    .max(100, "Identity must be less than 100 characters"),
  categoryId: z.string({ required_error: "Please select a category" }).min(1, "Please select a category"),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be less than 2000 characters"),
  postId: z.string(),
  parentId: z.string().nullable().optional(),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const voteSchema = z.object({
  value: z.number().min(-1).max(1),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
