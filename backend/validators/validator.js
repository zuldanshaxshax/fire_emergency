import { z } from "zod";

// User Schema
export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name cannot exceed 255 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
  role: z.enum(["admin", "staff"]).default("staff"),
});

// Client Schema
export const clientSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name cannot exceed 255 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
  lat: z
    .number()
    .refine((val) => val >= -90 && val <= 90, {
      message: "Latitude must be between -90 and 90",
    })
    .optional(),
  lng: z
    .number()
    .refine((val) => val >= -180 && val <= 180, {
      message: "Longitude must be between -180 and 180",
    })
    .optional(),
  address: z.string().optional(),
});

// Emergency Schema
export const emergencySchema = z.object({
  client_id: z.number().int("Client ID must be an integer"),
  description: z.string().optional(),
  lat: z
    .number()
    .refine((val) => val >= -90 && val <= 90, {
      message: "Latitude must be between -90 and 90",
    })
    .optional(),
  lng: z
    .number()
    .refine((val) => val >= -180 && val <= 180, {
      message: "Longitude must be between -180 and 180",
    })
    .optional(),
  address: z.string().optional(),
  level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z
    .enum(["pending", "assigned", "completed", "cancelled"])
    .default("pending"),
});

// Assignment Schema
export const assignmentSchema = z.object({
  staff_id: z.number().int("Staff ID must be an integer"),
  emergency_id: z.number().int("Emergency ID must be an integer"),
  status: z.enum(["assigned", "completed"]).default("assigned"),
});

// Login Schema
export const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
});
