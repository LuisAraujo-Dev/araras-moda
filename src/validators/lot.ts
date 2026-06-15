import { z } from "zod";
import { SourceType } from "@prisma/client";

export const createLotSchema = z.object({
  code: z.string().min(1, "O código do lote é obrigatório"),
  purchaseDate: z.coerce.date({ message: "A data da compra é obrigatória" }),
  sourceName: z.string().min(1, "O nome da origem é obrigatório"),
  sourceType: z.nativeEnum(SourceType, { message: "O tipo de origem é obrigatório" }),
  totalCost: z.number().min(0, "O custo total não pode ser negativo"),
  quantity: z.number().int().min(1, "A quantidade deve ser de pelo menos 1 peça"),
  notes: z.string().optional(),
});

export type CreateLotInput = z.infer<typeof createLotSchema>;