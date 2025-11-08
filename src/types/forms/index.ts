// Form-related types

import { z } from 'zod';

// Common form schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number');
export const amountSchema = z.number().min(0.01, 'Amount must be greater than 0');
export const percentageSchema = z.number().min(0).max(100, 'Percentage must be between 0 and 100');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Register form schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: phoneSchema.optional(),
  role: z.enum(['borrower', 'merchant'], { message: 'Please select a role' }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Forgot password form schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// Reset password form schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Change password form schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// Profile update form schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: phoneSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  postalCode: z.string().max(20, 'Postal code must be less than 20 characters').optional(),
  dateOfBirth: z.string().optional(),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

// Create loan form schema
export const createLoanSchema = z.object({
  amount: amountSchema,
  currency: z.string().min(1, 'Currency is required'),
  duration: z.number().min(1, 'Duration must be at least 1 day').max(365, 'Duration must be less than 365 days'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  merchantId: z.string().optional(),
});

export type CreateLoanFormValues = z.infer<typeof createLoanSchema>;

// Approve loan form schema
export const approveLoanSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  approvedAmount: amountSchema.optional(),
  interestRate: z.number().min(0).max(100, 'Interest rate must be between 0 and 100').optional(),
  duration: z.number().min(1).max(365, 'Duration must be between 1 and 365 days').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type ApproveLoanFormValues = z.infer<typeof approveLoanSchema>;

// Reject loan form schema
export const rejectLoanSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type RejectLoanFormValues = z.infer<typeof rejectLoanSchema>;

// Make payment form schema
export const makePaymentSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  amount: amountSchema,
  paymentMethod: z.enum(['mpesa', 'bank_transfer', 'crypto', 'card'], { message: 'Please select a payment method' }),
  transactionId: z.string().optional(),
});

export type MakePaymentFormValues = z.infer<typeof makePaymentSchema>;

// Create merchant form schema
export const createMerchantSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.string().min(2, 'Business type is required'),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  businessAddress: z.string().max(200, 'Business address must be less than 200 characters').optional(),
  businessPhone: phoneSchema.optional(),
  businessEmail: emailSchema.optional(),
  website: z.string().url('Please enter a valid URL').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
});

export type CreateMerchantFormValues = z.infer<typeof createMerchantSchema>;

// Update merchant form schema
export const updateMerchantSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').optional(),
  businessType: z.string().min(2, 'Business type is required').optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  businessAddress: z.string().max(200, 'Business address must be less than 200 characters').optional(),
  businessPhone: phoneSchema.optional(),
  businessEmail: emailSchema.optional(),
  website: z.string().url('Please enter a valid URL').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  settings: z.object({
    autoApproval: z.boolean().optional(),
    maxLoanAmount: amountSchema.optional(),
    interestRateRange: z.object({
      min: z.number().min(0).max(100),
      max: z.number().min(0).max(100),
    }).optional(),
    durationRange: z.object({
      min: z.number().min(1).max(365),
      max: z.number().min(1).max(365),
    }).optional(),
    supportedCurrencies: z.array(z.string()).optional(),
    paymentMethods: z.array(z.enum(['mpesa', 'bank_transfer', 'crypto', 'card'])).optional(),
  }).optional(),
});

export type UpdateMerchantFormValues = z.infer<typeof updateMerchantSchema>;

// Verify merchant form schema
export const verifyMerchantSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  status: z.enum(['active', 'inactive', 'suspended', 'rejected'], { message: 'Please select a status' }),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type VerifyMerchantFormValues = z.infer<typeof verifyMerchantSchema>;

// Search and filter form schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export type SearchFormValues = z.infer<typeof searchSchema>;

// KYC verification form schema
export const kycVerificationSchema = z.object({
  documentType: z.enum(['passport', 'national_id', 'drivers_license', 'other'], { message: 'Please select a document type' }),
  documentNumber: z.string().min(1, 'Document number is required'),
  documentImage: z.string().min(1, 'Document image is required'),
  selfieImage: z.string().min(1, 'Selfie image is required'),
  dateOfBirth: z.coerce.date({
    errorMap: () => ({ message: "Please provide a valid date" }),
  }),
  nationality: z.string().min(1, 'Nationality is required'),
});

export type KycVerificationFormValues = z.infer<typeof kycVerificationSchema>;

// Settings form schema
export const settingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
  }).optional(),
  security: z.object({
    twoFactorAuth: z.boolean().optional(),
    loginNotifications: z.boolean().optional(),
    sessionTimeout: z.number().min(5).max(1440).optional(), // minutes
  }).optional(),
  preferences: z.object({
    language: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    dateFormat: z.string().optional(),
  }).optional(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

// Form field types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: any;
  helperText?: string;
}

export interface FormSection {
  title: string;
  fields: FormField[];
  description?: string;
}

export interface FormConfig {
  title: string;
  description?: string;
  sections: FormSection[];
  submitButton: {
    label: string;
    loading?: boolean;
    disabled?: boolean;
  };
  cancelButton?: {
    label: string;
    disabled?: boolean;
  };
}

// Form error types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormTouched {
  [key: string]: boolean;
}

// Form state types
export interface FormState<T = any> {
  values: T;
  errors: FormErrors;
  touched: FormTouched;
  isSubmitting: boolean;
  isValid: boolean;
  dirty: boolean;
}

// Form submission types
export interface FormSubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
