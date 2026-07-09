"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SourceType } from "@prisma/client";

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
    
    await prisma.lot.create({
      data: { code: "LOTE-INICIAL", purchaseDate: new Date(), sourceName: "Carga de Teste", sourceType: SourceType.BAZAR, totalCost: 0, quantity: 1, companyId: realId },
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
      include: { 
        category: true, 
        brand: true, 
        lot: true, 
        size: true, 
        color: true, 
        store: true,
        images: true // Importante para carregar as fotos salvas
      },
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

export async function quickAddCategory(c: string, n: string) { return prisma.category.create({ data: { name: n, companyId: await getRealCompanyId(c) } }); }
export async function quickAddBrand(c: string, n: string) { return prisma.brand.create({ data: { name: n, companyId: await getRealCompanyId(c) } }); }
export async function quickAddSize(c: string, n: string) { return prisma.size.create({ data: { name: n, companyId: await getRealCompanyId(c) } }); }
export async function quickAddColor(c: string, n: string) { return prisma.color.create({ data: { name: n, companyId: await getRealCompanyId(c) } }); }
export async function quickAddStore(c: string, n: string) { return prisma.store.create({ data: { name: n, commissionPercentage: 50, companyId: await getRealCompanyId(c) } }); }
export async function quickAddLot(companyId: string, name: string) {
  const realId = await getRealCompanyId(companyId);
  const code = name.toUpperCase().replace(/\s+/g, '-').substring(0, 15) + `-${Math.floor(Math.random() * 1000)}`;
  return prisma.lot.create({ data: { code, purchaseDate: new Date(), sourceName: name, sourceType: SourceType.OUTRO, totalCost: 0, quantity: 1, companyId: realId } });
}

type CreatePieceInput = {
  name: string; categoryId: string; brandId: string; sizeId: string; colorId: string;
  tags: string[]; observations: string; lotId: string; storeId: string | null; purchasePrice: number;
  registerSale?: boolean; salePrice?: number;
  imageUrl?: string; // Novo campo para receber a URL do Vercel Blob
};

export async function createPieceAction(companyId: string, data: CreatePieceInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    const autoCode = `AM-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPiece = await prisma.piece.create({
      data: {
        code: autoCode, qrCode: `QR-${autoCode}`, name: data.name, categoryId: data.categoryId, brandId: data.brandId,
        sizeId: data.sizeId, colorId: data.colorId, tags: data.tags, observations: data.observations,
        gender: "UNISSEX", lotId: data.lotId, storeId: data.storeId, purchasePrice: data.purchasePrice,
        estimatedSalePrice: 0, status: data.tags.includes("Vendida") ? "VENDIDA" : "ESTOQUE", companyId: realId,
      },
    });

    // Se a imagem foi recebida, salvamos no banco atrelada a esta nova peça
    if (data.imageUrl) {
      await prisma.pieceImage.create({
        data: {
          pieceId: newPiece.id,
          imageUrl: data.imageUrl,
          order: 0
        }
      });
    }

    if (data.registerSale && data.salePrice) {
      await prisma.revenue.create({
        data: { amount: data.salePrice, type: "Venda", description: `Venda Direta: ${autoCode} - ${data.name}`, date: new Date(), companyId: realId }
      });
    }
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao cadastrar a peça." };
  }
}

export async function updatePieceAction(pieceId: string, companyId: string, data: CreatePieceInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    const piece = await prisma.piece.findUnique({ where: { id: pieceId } });

    await prisma.piece.update({
      where: { id: pieceId, companyId: realId },
      data: {
        name: data.name, categoryId: data.categoryId, brandId: data.brandId, sizeId: data.sizeId, colorId: data.colorId,
        tags: data.tags, observations: data.observations, lotId: data.lotId, storeId: data.storeId, purchasePrice: data.purchasePrice,
        status: data.tags.includes("Vendida") ? "VENDIDA" : (data.storeId ? "CONSIGNADA" : "ESTOQUE")
      },
    });

    // Se uma nova imagem foi enviada durante a edição
    if (data.imageUrl) {
      // Deletamos imagens antigas para garantir que só fica a nova
      await prisma.pieceImage.deleteMany({
        where: { pieceId: pieceId }
      });
      // Criamos a nova referência
      await prisma.pieceImage.create({
        data: {
          pieceId: pieceId,
          imageUrl: data.imageUrl,
          order: 0
        }
      });
    }

    if (data.registerSale && data.salePrice) {
      await prisma.revenue.create({
        data: { amount: data.salePrice, type: "Venda", description: `Venda: ${piece?.code} - ${data.name}`, date: new Date(), companyId: realId }
      });
    }
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar a peça." };
  }
}

export async function deletePieceAction(pieceId: string, companyId: string) {
  try {
    await prisma.piece.delete({ where: { id: pieceId, companyId: await getRealCompanyId(companyId) } });
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao excluir a peça." };
  }
}