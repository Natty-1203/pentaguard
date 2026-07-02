import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  role: z.enum(['super_admin', 'admin', 'agent', 'claim_staff']),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  companyId: z.number().int().positive().optional(),
});

export const customerSchema = z.object({
  First_Name: z.string().min(1, 'First name is required').max(100),
  Last_Name: z.string().min(1, 'Last name is required').max(100),
  DOB: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  Email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  Gender: z.enum(['Male', 'Female', 'Other']).optional(),
  Fayda_No: z.string().max(50).optional(),
  Phone: z.string().max(20).optional(),
});

export const branchSchema = z.object({
  Branch_Name: z.string().min(1, 'Branch name is required').max(200),
  Region: z.string().max(100).optional(),
  City: z.string().max(100).optional(),
  Woreda: z.string().max(20).optional(),
  Kebele: z.string().max(20).optional(),
  Status: z.enum(['Active', 'Inactive']).optional(),
  Phone: z.string().max(20).optional(),
});

export const agentSchema = z.object({
  First_Name: z.string().min(1, 'First name is required').max(100),
  Last_Name: z.string().min(1, 'Last name is required').max(100),
  Branch_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Commission_Rate: z.union([z.number().min(0).max(100), z.string()]).optional(),
  Email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  License_No: z.string().max(50).optional(),
  Status: z.enum(['Active', 'Inactive']).optional(),
});

export const quoteSchema = z.object({
  Customer_Id: z.union([z.number().int().positive(), z.string().transform(Number)]),
  Agent_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Branch_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Insurance_Type_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Premium_Amount: z.union([z.number().min(0), z.string()]).optional(),
  Status: z.string().max(50).optional(),
});

export const policySchema = z.object({
  Customer_Id: z.union([z.number().int().positive(), z.string().transform(Number)]),
  Branch_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Quote_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Insurance_Type_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Policy_No: z.string().max(50).optional(),
  Start_Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  End_Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  Status: z.string().max(50).optional(),
  Total_Premium: z.union([z.number().min(0), z.string()]).optional(),
});

export const claimSchema = z.object({
  Policy_Id: z.union([z.number().int().positive(), z.string().transform(Number)]),
  Claim_Staff_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Incident_Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  Loss_Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  Status: z.string().max(50).optional(),
  Description: z.string().max(2000).optional(),
});

export const companySchema = z.object({
  Company_Name: z.string().min(1, 'Company name is required').max(200),
  Head_Office_Address: z.string().max(500).optional(),
  License_No: z.string().max(100).optional(),
  Subscription_Plan: z.string().max(50).optional(),
  Subscription_Status: z.string().max(50).optional(),
  Max_Branches: z.union([z.number().int().positive(), z.string()]).optional(),
  Max_Policies: z.union([z.number().int().positive(), z.string()]).optional(),
  Status: z.string().max(50).optional(),
});

export const paymentSchema = z.object({
  Policy_Id: z.union([z.number().int().positive(), z.string().transform(Number)]),
  Amount: z.union([z.number().min(0), z.string()]),
  Payment_Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  Status: z.string().max(50).optional(),
});

export const documentSchema = z.object({
  Policy_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).nullable().optional(),
  Claim_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).nullable().optional(),
  File_Name: z.string().min(1, 'File name is required').max(255),
  Document_Type: z.string().max(50).optional(),
  File_Path: z.string().max(500).optional(),
});

export const notificationSchema = z.object({
  Customer_Id: z.union([z.number().int().positive(), z.string().transform(Number)]),
  Channel: z.string().max(50).optional(),
  Message_Type: z.string().max(100).optional(),
  Message_Body: z.string().max(5000).optional(),
  Status: z.string().max(50).optional(),
});

export const subscriptionPlanSchema = z.object({
  Plan_Name: z.string().min(1, 'Plan name is required').max(100),
  Monthly_Fee: z.union([z.number().min(0), z.string()]),
  Max_Branches: z.union([z.number().int().positive(), z.string()]).optional(),
  Max_Policies: z.union([z.number().int().positive(), z.string()]).optional(),
  Max_Staff: z.union([z.number().int().positive(), z.string()]).optional(),
  Features: z.any().optional(),
});

export const invoiceSchema = z.object({
  Company_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Plan_Id: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Amount: z.union([z.number().min(0), z.string()]),
  Total_Amount: z.union([z.number().min(0), z.string()]).optional(),
  Issued_Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  Invoice_Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  Due_Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  Status: z.string().max(50).optional(),
});

export const workflowStepSchema = z.object({
  Step_Name: z.string().min(1, 'Step name is required').max(100),
  Assigned_To: z.union([z.number().int().positive(), z.string().transform(Number)]).optional(),
  Action_Taken: z.string().max(500).optional(),
  Notes: z.string().max(2000).optional(),
});

export const updateStatusSchema = z.object({
  Status: z.string().min(1, 'Status is required').max(50),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});
