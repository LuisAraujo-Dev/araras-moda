import { z } from "zod";

export const createRevenueSchema = z.object({
  amount: z.number().positive({ message: "O valor deve ser maior que zero" }),
  type: z.string().min(1, { message: "A categoria da receita é obrigatória" }),
  description: z.string().optional().nullable(),
  date: z.coerce.date({ message: "A data é obrigatória ou inválida" }),
});

export type CreateRevenueInput = z.infer<typeof createRevenueSchema>;

export const createExpenseSchema = z.object({
  amount: z.number().positive({ message: "O valor deve ser maior que zero" }),
  category: z.string().min(1, { message: "A categoria da despesa é obrigatória" }),
  description: z.string().optional().nullable(),
  date: z.coerce.date({ message: "A data é obrigatória ou inválida" }),
  isApportioned: z.boolean().optional(),
  pieceIdsToApportion: z.array(z.string()).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;