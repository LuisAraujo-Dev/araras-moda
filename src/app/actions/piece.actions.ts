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

// Geração de Taxonomia de Teste
export async function seedTaxonomyAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);

    const existingCat = await prisma.category.findFirst({ where: { companyId: realId } });
    if (existingCat) return { success: true };

    await prisma.category.create({ data: { name: "Calça", companyId: realId } });
    await prisma.brand.create({ data: { name: "Gucci", companyId: realId } });
    await prisma.size.create({ data: { name: "40", companyId: realId } });
    await prisma.color.create({ data: { name: "Preta", companyId: realId } });
    
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
    console.error("Erro no seed:", error);
    return { error: "Falha ao gerar dados de taxonomia." };
  }
}

// Buscar Peças
export async function getPiecesAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    return await prisma.piece.findMany({
      where: { companyId: realId },
      include: { category: true, brand: true, lot: true, size: true, color: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Buscar Todas as Opções (Categorias, Marcas, Lotes, Tamanhos e Cores) limitando às mais recentes
export async function getTaxonomyAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    const [categories, brands, lots, sizes, colors] = await Promise.all([
      prisma.category.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
      prisma.brand.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
      prisma.lot.findMany({ where: { companyId: realId }, take: 15, orderBy: { createdAt: 'desc' } }),
      prisma.size.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
      prisma.color.findMany({ where: { companyId: realId }, take: 15, orderBy: { name: 'asc' } }),
    ]);
    return { categories, brands, lots, sizes, colors };
  } catch (error) {
    console.error(error);
    return { categories: [], brands: [], lots: [], sizes: [], colors: [] };
  }
}

// --- AÇÕES RÁPIDAS PARA O "CADASTRAR NOVA OPÇÃO" ---
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

// --- CRIAÇÃO DA PEÇA AUTOMATIZADA ---
type CreatePieceInput = {
  name: string;
  categoryId: string;
  brandId: string;
  sizeId: string;
  colorId: string;
  condition: string;
  lotId: string;
  purchasePrice: number;
};

export async function createPieceAction(companyId: string, data: CreatePieceInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    // Gera um SKU Automático Ex: AM-847392
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
        condition: data.condition,
        gender: "UNISSEX", // Padrão automático para não travar o banco
        lotId: data.lotId,
        purchasePrice: data.purchasePrice,
        estimatedSalePrice: 0, // Preço de venda zerado por padrão na entrada
        status: PieceStatus.ESTOQUE,
        companyId: realId,
      } as Prisma.PieceUncheckedCreateInput,
    });
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error("Erro na criacao:", error);
    return { error: "Falha ao cadastrar a peça. Verifique os dados." };
  }
}