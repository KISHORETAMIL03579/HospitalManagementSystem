import { z } from "zod";
import { Gender } from "../types/patient.types";

export const createPatientSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => {
      const date = new Date(val);
      return date < new Date();
    }, "Date of birth must be in the past"),
  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  bloodGroup: z.number().optional(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .max(30, "Phone number cannot exceed 30 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z
    .string()
    .max(200, "Address cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
  emergencyContactName: z.string().max(100).optional().or(z.literal("")),
  emergencyContactPhone: z.string().max(30).optional().or(z.literal("")),
});

export type CreatePatientFormValues = z.infer<typeof createPatientSchema>;
