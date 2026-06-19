//src/app/actions/piece.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PieceStatus, Prisma, SourceType } from "@prisma/client";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function seedTaxonomyAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);

    const existingCat = await prisma.category.findFirst({ where: { companyId: realId } });
    if (existingCat) return { success: true };

    await prisma.category.create({ data: { name: "Camisetas", companyId: realId } });
    await prisma.brand.create({ data: { name: "Vintage", companyId: realId } });
    
    await prisma.lot.create({
      data: {
        code: "LOTE-INICIAL",
        purchaseDate: new Date(),
        sourceName: "Carga de Teste",
        sourceType: SourceType.BAZAR,
        totalCost: 0,
        quantity: 1,
        companyId: realId,
      } as Prisma.LotUncheckedCreateInput,
    });

    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao gerar dados de taxonomia." };
  }
}

export async function getPiecesAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    return await prisma.piece.findMany({
      where: { companyId: realId },
      include: { category: true, brand: true, lot: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getTaxonomyAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    const [categories, brands, lots] = await Promise.all([
      prisma.category.findMany({ where: { companyId: realId } }),
      prisma.brand.findMany({ where: { companyId: realId } }),
      prisma.lot.findMany({ where: { companyId: realId } }),
    ]);
    return { categories, brands, lots };
  } catch (error) {
    console.error(error);
    return { categories: [], brands: [], lots: [] };
  }
}

type CreatePieceInput = {
  code: string;
  name: string;
  categoryId: string;
  brandId: string;
  lotId: string;
  purchasePrice: number;
  estimatedSalePrice: number;
  status: PieceStatus;
};

export async function createPieceAction(companyId: string, data: CreatePieceInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.piece.create({
      data: {
        code: data.code,
        name: data.name,
        categoryId: data.categoryId,
        brandId: data.brandId,
        lotId: data.lotId,
        purchasePrice: data.purchasePrice,
        estimatedSalePrice: data.estimatedSalePrice,
        status: data.status,
        companyId: realId,
      } as Prisma.PieceUncheckedCreateInput,
    });
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao cadastrar a peça. Verifique os dados." };
  }
}