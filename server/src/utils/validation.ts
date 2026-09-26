import { z } from "zod";

const nameField = z
  .string({ error: "Name is required" })
  .trim()
  .min(3, "Name must have at least 3 characters")
  .max(10, "Name can have at most 10 characters")
  .regex(/^[\p{L}\p{M}][\p{L}\p{M}' -]*$/u, "Name can only contain letters, spaces, hyphens and apostrophes");

const optionalNameField = z
  .union([
    nameField,
    z.literal("").transform(() => undefined),
  ])
  .optional();

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(254, "Email can have at most 254 characters")
  .pipe(z.email({ error: "Please provide a valid email address" }));

const userNameField = z
  .string({ error: "Username is required" })
  .trim()
  .toLowerCase()
  .min(5, "Username must have at least 5 characters")
  .max(20, "Username can have at most 20 characters")
  .regex(/^[a-z0-9_.]+$/, "Username can only contain letters, numbers, dots and underscores");

const passwordField = z
  .string({ error: "Password is required" })
  .min(8, "Password must have at least 8 characters")
  .max(20, "Password can have at most 20 characters")
  .regex(/^\S+$/, "Password must not contain spaces")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9\s]/, "Password must contain at least one special character");

export const registerUserSchema = z.object({
  firstName: nameField,
  lastName: optionalNameField,
  email: emailField,
  password: passwordField,
});

export const loginUserSchema = z
  .object({
    userName: userNameField.optional(),
    email: emailField.optional(),
    password: z.string({ error: "Password is required" }).min(1, "Password is required"),
  })
  .refine((data) => Boolean(data.userName || data.email), {
    error: "Provide either a username or an email",
    path: ["userName"],
  });

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
