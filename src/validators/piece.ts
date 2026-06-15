// src/validators/piece.ts
import { z } from "zod";
import { PieceCondition, Gender } from "@prisma/client";

export const createPieceSchema = z.object({
  lotId: z.string().min(1, { message: "O lote é obrigatório" }),
  code: z.string().min(1, { message: "O código da peça é obrigatório" }),
  qrCode: z.string().min(1, { message: "O QR Code é obrigatório" }),
  name: z.string().min(1, { message: "O nome da peça é obrigatório" }),
  categoryId: z.string().min(1, { message: "A categoria é obrigatória" }),
  brandId: z.string().min(1, { message: "A marca é obrigatória" }),
  colorId: z.string().min(1, { message: "A cor é obrigatória" }),
  sizeId: z.string().min(1, { message: "O tamanho é obrigatório" }),
  condition: z.nativeEnum(PieceCondition, { message: "A condição é obrigatória" }),
  gender: z.nativeEnum(Gender, { message: "O gênero é obrigatório" }),
  purchasePrice: z.number().min(0, { message: "O preço de compra não pode ser negativo" }),
  estimatedSalePrice: z.number().min(0, { message: "O preço de venda não pode ser negativo" }),
  notes: z.string().optional(),
  
  // Localização é opcional no momento do cadastro
  room: z.string().optional(),
  rack: z.string().optional(),
  box: z.string().optional(),
  drawer: z.string().optional(),
});

export type CreatePieceInput = z.infer<typeof createPieceSchema>;