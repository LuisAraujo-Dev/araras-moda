// src/validators/consignment.ts   
import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().min(1, { message: "O nome do parceiro é obrigatório" }),
  phone: z.string().optional(),
  email: z.string().email({ message: "E-mail inválido" }).optional().or(z.literal("")),
  address: z.string().optional(),
  commissionPercentage: z.number().min(0).max(100, { message: "A comissão deve ser entre 0 e 100" }),
  notes: z.string().optional(),
});

export const createConsignmentSchema = z.object({
  storeId: z.string().min(1, { message: "O parceiro é obrigatório" }),
  startDate: z.coerce.date({ message: "A data de início é obrigatória" }),
  expectedReturnDate: z.coerce.date().optional(),
  pieceIds: z.array(z.string()).min(1, { message: "Adicione pelo menos uma peça à consignação" }),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type CreateConsignmentInput = z.infer<typeof createConsignmentSchema>;