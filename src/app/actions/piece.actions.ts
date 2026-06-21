//src/app/actions/piece.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PieceStatus, SourceType } from "@prisma/client";

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

    await prisma.category.create({ data: { name: "Calça", companyId: realId } });
    await prisma.brand.create({ data: { name: "Gucci", companyId: realId } });
    await prisma.size.create({ data: { name: "40", companyId: realId } });
    await prisma.color.create({ data: { name: "Preta", companyId: realId } });
    await prisma.store.create({ data: { name: "Peça Rara Gama", commissionPercentage: 50, companyId: realId } });
    
    await prisma.lot.create({
      data: {
        code: "LOTE-INICIAL",
        purchaseDate: new Date(),
        sourceName: "Carga de Teste",
        sourceType: SourceType.BAZAR,
        totalCost: 0,
        quantity: 1,
        companyId: realId,
      },
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
      include: { category: true, brand: true, lot: true, size: true, color: true, store: true },
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
    const [categories, brands, lots, sizes, colors, stores] = await Promise.all([
      prisma.category.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
      prisma.brand.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
      prisma.lot.findMany({ where: { companyId: realId }, take: 15, orderBy: { createdAt: 'desc' } }),
      prisma.size.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
      prisma.color.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
      prisma.store.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
    ]);
    return { categories, brands, lots, sizes, colors, stores };
  } catch (error) {
    console.error(error);
    return { categories: [], brands: [], lots: [], sizes: [], colors: [], stores: [] };
  }
}

export async function quickAddCategory(companyId: string, name: string) {
  const realId = await getRealCompanyId(companyId);
  return prisma.category.create({ data: { name, companyId: realId } });
}
export async function quickAddBrand(companyId: string, name: string) {
  const realId = await getRealCompanyId(companyId);
  return prisma.brand.create({ data: { name, companyId: realId } });
}
export async function quickAddSize(companyId: string, name: string) {
  const realId = await getRealCompanyId(companyId);
  return prisma.size.create({ data: { name, companyId: realId } });
}
export async function quickAddColor(companyId: string, name: string) {
  const realId = await getRealCompanyId(companyId);
  return prisma.color.create({ data: { name, companyId: realId } });
}
export async function quickAddStore(companyId: string, name: string) {
  const realId = await getRealCompanyId(companyId);
  return prisma.store.create({ data: { name, commissionPercentage: 50, companyId: realId } });
}
export async function quickAddLot(companyId: string, name: string) {
  const realId = await getRealCompanyId(companyId);
  const code = name.toUpperCase().replace(/\s+/g, '-').substring(0, 15) + `-${Math.floor(Math.random() * 1000)}`;
  
  return prisma.lot.create({
    data: {
      code: code,
      purchaseDate: new Date(),
      sourceName: name,
      sourceType: SourceType.OUTRO,
      totalCost: 0,
      quantity: 1,
      companyId: realId,
    },
  });
}

type CreatePieceInput = {
  name: string;
  categoryId: string;
  brandId: string;
  sizeId: string;
  colorId: string;
  tags: string[];
  observations: string;
  lotId: string;
  storeId: string | null;
  purchasePrice: number;
};

export async function createPieceAction(companyId: string, data: CreatePieceInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    const autoCode = `AM-${Math.floor(100000 + Math.random() * 900000)}`;
    const autoQrCode = `QR-${autoCode}`;

    await prisma.piece.create({
      data: {
        code: autoCode,
        qrCode: autoQrCode,
        name: data.name,
        categoryId: data.categoryId,
        brandId: data.brandId,
        sizeId: data.sizeId,
        colorId: data.colorId,
        tags: data.tags,
        observations: data.observations,
        gender: "UNISSEX",
        lotId: data.lotId,
        storeId: data.storeId,
        purchasePrice: data.purchasePrice,
        estimatedSalePrice: 0,
        status: PieceStatus.ESTOQUE,
        companyId: realId,
      },
    });
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao cadastrar a peça. Verifique os dados selecionados." };
  }
}

export async function updatePieceAction(pieceId: string, companyId: string, data: CreatePieceInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.piece.update({
      where: { id: pieceId, companyId: realId },
      data: {
        name: data.name,
        categoryId: data.categoryId,
        brandId: data.brandId,
        sizeId: data.sizeId,
        colorId: data.colorId,
        tags: data.tags,
        observations: data.observations,
        lotId: data.lotId,
        storeId: data.storeId,
        purchasePrice: data.purchasePrice,
      },
    });
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar a peça." };
  }
}

export async function deletePieceAction(pieceId: string, companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.piece.delete({
      where: { id: pieceId, companyId: realId },
    });
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao excluir a peça." };
  }
}