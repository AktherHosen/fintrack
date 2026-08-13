import { z } from "zod";

const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/, "Invalid money format")
  .refine((v) => parseFloat(v) > 0, "Amount must be positive");

export const healthSchema = z.object({
  status: z.literal("ok"),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().min(1).optional(),
  locale: z.enum(["en", "bn"]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const createRecurringSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/)
    .refine((v) => parseFloat(v) > 0),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  description: z.string().max(500).optional(),
  nextRunAt: z.string().datetime(),
});

export const updateRecurringSchema = createRecurringSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createLoanSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["BORROWED", "LENT"]),
  principal: moneySchema,
  interestRate: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0"),
  currency: z.string().length(3).default("BDT"),
  accountId: z.string().optional(),
  counterparty: z.string().max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  termMonths: z.coerce.number().int().min(1).max(600).optional(),
  monthlyPayment: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  notes: z.string().max(500).optional(),
});

export const updateLoanSchema = createLoanSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAID_OFF", "CLOSED"]).optional(),
});

export const recordLoanPaymentSchema = z.object({
  amount: moneySchema,
  principalAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  interestAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
  createTransaction: z.boolean().default(false),
  categoryId: z.string().optional(),
});

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["CASH", "BANK", "MOBILE_WALLET", "SAVINGS", "CREDIT_CARD", "OTHER"]),
  currency: z.string().length(3).default("BDT"),
  openingBalance: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0"),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
});

export const createTransactionSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: moneySchema,
  description: z.string().max(500).optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reference: z.string().max(100).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const createTransferSchema = z
  .object({
    fromAccountId: z.string().min(1),
    toAccountId: z.string().min(1),
    amount: moneySchema,
    transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().max(500).optional(),
  })
  .refine((d) => d.fromAccountId !== d.toAccountId, {
    message: "Cannot transfer to the same account",
    path: ["toAccountId"],
  });

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  amount: moneySchema,
  period: z.enum(["MONTHLY", "WEEKLY", "YEARLY", "CUSTOM"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export const reportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const transactionFilterSchema = paginationSchema.extend({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const manualPaymentSchema = z.object({
  planSlug: z.string().min(1),
  transactionId: z.string().min(5).max(50),
  senderNumber: z.string().regex(/^01\d{9}$/, "Invalid Bangladesh mobile number"),
});

export const rejectPaymentSchema = z.object({
  adminNote: z.string().min(3).max(500),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  price: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currency: z.string().length(3).default("BDT"),
  billingInterval: z.enum(["MONTHLY", "YEARLY"]),
  features: z.record(z.union([z.number(), z.boolean(), z.null()])),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type RecordLoanPaymentInput = z.infer<typeof recordLoanPaymentSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
