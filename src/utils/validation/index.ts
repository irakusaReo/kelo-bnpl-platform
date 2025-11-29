import { z } from "zod";
import { VALIDATION_CONFIG } from "@/utils/constants";

// Email validation
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .regex(VALIDATION_CONFIG.email.pattern, VALIDATION_CONFIG.email.message);

// Phone validation (Kenyan format)
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(VALIDATION_CONFIG.phone.pattern, VALIDATION_CONFIG.phone.message);

// Password validation
export const passwordSchema = z
  .string()
  .min(VALIDATION_CONFIG.password.minLength, `Password must be at least ${VALIDATION_CONFIG.password.minLength} characters`)
  .refine(
    (password) => {
      if (VALIDATION_CONFIG.password.requireUppercase) {
        return /[A-Z]/.test(password);
      }
      return true;
    },
    {
      message: "Password must contain at least one uppercase letter",
    }
  )
  .refine(
    (password) => {
      if (VALIDATION_CONFIG.password.requireLowercase) {
        return /[a-z]/.test(password);
      }
      return true;
    },
    {
      message: "Password must contain at least one lowercase letter",
    }
  )
  .refine(
    (password) => {
      if (VALIDATION_CONFIG.password.requireNumber) {
        return /[0-9]/.test(password);
      }
      return true;
    },
    {
      message: "Password must contain at least one number",
    }
  )
  .refine(
    (password) => {
      if (VALIDATION_CONFIG.password.requireSpecialChar) {
        return /[!@#$%^&*(),.?":{}|<>]/.test(password);
      }
      return true;
    },
    {
      message: "Password must contain at least one special character",
    }
  );

// ID Number validation (Kenyan)
export const idNumberSchema = z
  .string()
  .min(1, "ID number is required")
  .regex(VALIDATION_CONFIG.idNumber.pattern, VALIDATION_CONFIG.idNumber.message);

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes");

// Amount validation
export const amountSchema = z
  .number()
  .min(1, "Amount must be greater than 0")
  .max(10000000, "Amount must be less than 10,000,000");

// Loan amount validation
export const loanAmountSchema = z
  .number()
  .min(1000, "Minimum loan amount is KES 1,000")
  .max(500000, "Maximum loan amount is KES 500,000");

// Duration validation
export const durationSchema = z
  .number()
  .min(1, "Duration must be at least 1 month")
  .max(24, "Duration must be less than 24 months");

// Interest rate validation
export const interestRateSchema = z
  .number()
  .min(0, "Interest rate cannot be negative")
  .max(1, "Interest rate cannot exceed 100%");

// Date validation
export const dateSchema = z
  .string()
  .min(1, "Date is required")
  .refine(
    (dateString) => {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    },
    {
      message: "Please enter a valid date",
    }
  )
  .refine(
    (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      return date <= now;
    },
    {
      message: "Date cannot be in the future",
    }
  );

// Future date validation
export const futureDateSchema = z
  .string()
  .min(1, "Date is required")
  .refine(
    (dateString) => {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    },
    {
      message: "Please enter a valid date",
    }
  )
  .refine(
    (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      return date > now;
    },
    {
      message: "Date must be in the future",
    }
  );

// URL validation
export const urlSchema = z
  .string()
  .min(1, "URL is required")
  .url("Please enter a valid URL");

// File validation
export const fileSchema = z
  .instanceof(File, "Please select a file")
  .refine(
    (file) => file.size > 0,
    {
      message: "File cannot be empty",
    }
  )
  .refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    {
      message: "File size must be less than 10MB",
    }
  );

// Image file validation
export const imageSchema = fileSchema.refine(
  (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    return allowedTypes.includes(file.type);
  },
  {
    message: "Only JPEG, PNG, GIF, and WebP images are allowed",
  }
);

// PDF file validation
export const pdfSchema = fileSchema.refine(
  (file) => file.type === "application/pdf",
  {
    message: "Only PDF files are allowed",
  }
);

// Business registration number validation
export const businessRegNumberSchema = z
  .string()
  .min(1, "Business registration number is required")
  .regex(/^[A-Za-z0-9\s-]+$/, "Business registration number can only contain letters, numbers, spaces, and hyphens");

// Tax ID validation
export const taxIdSchema = z
  .string()
  .min(1, "Tax ID is required")
  .regex(/^[A-Za-z0-9\s-]+$/, "Tax ID can only contain letters, numbers, spaces, and hyphens");

// Bank account number validation
export const bankAccountSchema = z
  .string()
  .min(1, "Bank account number is required")
  .regex(/^\d+$/, "Bank account number can only contain numbers");

// Bank name validation
export const bankNameSchema = z
  .string()
  .min(2, "Bank name must be at least 2 characters")
  .max(100, "Bank name must be less than 100 characters")
  .regex(/^[a-zA-Z\s&.-]+$/, "Bank name can only contain letters, spaces, &, ., and -");

// Description validation
export const descriptionSchema = z
  .string()
  .min(10, "Description must be at least 10 characters")
  .max(1000, "Description must be less than 1000 characters");

// Address validation
export const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

// Combined validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

export const loanApplicationSchema = z.object({
  amount: loanAmountSchema,
  duration: durationSchema,
  purpose: descriptionSchema,
  merchantId: z.string().min(1, "Merchant is required"),
});

export const paymentSchema = z.object({
  amount: amountSchema,
  paymentMethod: z.enum(["mpesa", "bank_transfer", "crypto", "wallet"], {
    errorMap: () => ({ message: "Please select a valid payment method" }),
  }),
});

export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  idNumber: idNumberSchema.optional(),
  occupation: z.string().optional(),
  monthlyIncome: z.number().min(0, "Monthly income cannot be negative").optional(),
});

export const merchantRegistrationSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.enum(["retail", "ecommerce", "service", "restaurant", "other"], {
    errorMap: () => ({ message: "Please select a valid business type" }),
  }),
  registrationNumber: businessRegNumberSchema,
  taxId: taxIdSchema.optional(),
  description: descriptionSchema.optional(),
  website: urlSchema.optional(),
  contactInfo: z.object({
    email: emailSchema,
    phone: phoneSchema,
  }),
  businessAddress: addressSchema,
});

// Utility functions
export function validateField<T>(
  schema: z.ZodSchema<T>,
  data: any
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
}

export function getFieldErrorMessage(error: z.ZodError, fieldName: string): string {
  const fieldError = error.errors.find((err) => err.path[0] === fieldName);
  return fieldError?.message || "";
}

export function hasFieldError(error: z.ZodError, fieldName: string): boolean {
  return error.errors.some((err) => err.path[0] === fieldName);
}

// Custom validation functions
export function isValidKenyanPhone(phone: string): boolean {
  return VALIDATION_CONFIG.phone.pattern.test(phone);
}

export function isValidEmail(email: string): boolean {
  return VALIDATION_CONFIG.email.pattern.test(email);
}

export function isStrongPassword(password: string): boolean {
  const config = VALIDATION_CONFIG.password;
  
  if (password.length < config.minLength) return false;
  if (config.requireUppercase && !/[A-Z]/.test(password)) return false;
  if (config.requireLowercase && !/[a-z]/.test(password)) return false;
  if (config.requireNumber && !/[0-9]/.test(password)) return false;
  if (config.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  
  return true;
}

export function isValidIdNumber(idNumber: string): boolean {
  return VALIDATION_CONFIG.idNumber.pattern.test(idNumber);
}

export function isAdult(dateOfBirth: string): boolean {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
}

export function isValidFutureDate(date: string): boolean {
  const inputDate = new Date(date);
  const today = new Date();
  return inputDate > today;
}

export function isValidPastDate(date: string): boolean {
  const inputDate = new Date(date);
  const today = new Date();
  return inputDate <= today;
}