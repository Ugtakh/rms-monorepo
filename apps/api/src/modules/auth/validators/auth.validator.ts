import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const registerEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  roleName: z.enum(["ORG_ADMIN", "MANAGER", "CASHIER", "CHEF", "WAITER"]),
  branchId: z.string().optional()
});
