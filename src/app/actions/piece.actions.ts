"use server";

import { PieceService } from "@/services/piece.service";
import { createPieceSchema } from "@/validators/piece";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createPieceAction(companyId: string, userId: string, data: unknown) {
  const validatedFields = createPieceSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Dados inválidos ou mal formatados." };
  }

  try {
    await PieceService.createPiece(companyId, userId, validatedFields.data);
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao registar a peça no banco de dados." };
  }
}

export async function getPiecesAction(companyId: string) {
  try {
    return await prisma.piece.findMany({
      where: { companyId },
      include: {
        category: true,
        brand: true,
        size: true,
        color: true,
        lot: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getInventoryDependencies(companyId: string) {
  try {
    const [lots, categories, brands, sizes, colors] = await Promise.all([
      prisma.lot.findMany({ where: { companyId } }),
      prisma.category.findMany({ where: { companyId } }),
      prisma.brand.findMany({ where: { companyId } }),
      prisma.size.findMany({ where: { companyId } }),
      prisma.color.findMany({ where: { companyId } }),
    ]);
    return { lots, categories, brands, sizes, colors };
  } catch (error) {
    console.error(error);
    return { lots: [], categories: [], brands: [], sizes: [], colors: [] };
  }
}

export async function seedTaxonomiesAction(companyId: string) {
  try {
    const existingLot = await prisma.lot.findFirst({ where: { companyId } });
    let lotId = existingLot?.id;

    if (!lotId) {
      const newLot = await prisma.lot.create({
        data: {
          companyId,
          code: "LOTE-TESTE",
          purchaseDate: new Date(),
          sourceName: "Garimpo Inicial",
          sourceType: "BAZAR",
          totalCost: 150.0,
          quantity: 15,
        },
      });
      lotId = newLot.id;
    }

    await Promise.all([
      prisma.category.create({ data: { companyId, name: "Camisa" } }),
      prisma.brand.create({ data: { companyId, name: "Vintage Brand" } }),
      prisma.size.create({ data: { companyId, name: "G" } }),
      prisma.color.create({ data: { companyId, name: "Preto", hexCode: "#000000" } }),
    ]);

    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao gerar dados de taxonomia." };
  }
}