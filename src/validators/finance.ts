import { z } from "zod";
import { RevenueType, ExpenseCategory } from "@prisma/client";

export const createRevenueSchema = z.object({
  amount: z.number().positive({ message: "O valor deve ser maior que zero" }),
  type: z.nativeEnum(RevenueType, { message: "Tipo de receita inválido" }),
  description: z.string().optional(),
  date: z.coerce.date({ message: "Data inválida" }),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive({ message: "O valor deve ser maior que zero" }),
  category: z.nativeEnum(ExpenseCategory, { message: "Categoria de despesa inválida" }),
  description: z.string().optional(),
  date: z.coerce.date({ message: "Data inválida" }),
  pieceIdsToApportion: z.array(z.string()).optional(),
});

export type CreateRevenueInput = z.infer<typeof createRevenueSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;