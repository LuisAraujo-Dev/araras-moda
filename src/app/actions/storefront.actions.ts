//src/app/actions/storefront.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getRealCompanyId() {
  const company = await prisma.company.findFirst();
  return company?.id || "company-placeholder-id";
}

export async function getStorefrontConfigAction() {
  try {
    const companyId = await getRealCompanyId();
    const config = await prisma.storefrontConfig.findUnique({
      where: { companyId },
    });
    return { success: true, data: config };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao carregar a configuração." };
  }
}

export async function updateStorefrontConfigAction(data: {
  slug: string;
  description?: string;
  whatsapp?: string;
  instagram?: string;
  logoUrl?: string;
}) {
  try {
    const companyId = await getRealCompanyId();

    // Verificamos primeiro se a configuração existe para esta empresa
    const existingConfig = await prisma.storefrontConfig.findUnique({
      where: { companyId },
    });

    let config;

    if (existingConfig) {
      // Se existe, fazemos UPDATE
      config = await prisma.storefrontConfig.update({
        where: { companyId },
        data: {
          slug: data.slug,
          description: data.description,
          whatsapp: data.whatsapp,
          instagram: data.instagram,
          logoUrl: data.logoUrl,
        },
      });
    } else {
      // Se NÃO existe, fazemos CREATE
      config = await prisma.storefrontConfig.create({
        data: {
          companyId,
          slug: data.slug,
          description: data.description,
          whatsapp: data.whatsapp,
          instagram: data.instagram,
          logoUrl: data.logoUrl,
        },
      });
    }

    revalidatePath("/dashboard/storefront");
    return { success: true, data: config };
  } catch (error: any) {
    console.error("Erro na ação updateStorefrontConfigAction:", error);
    
    // Devolve uma mensagem de erro mais amigável caso alguém tente usar um nome que já existe
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return { success: false, error: "Este nome de loja já está em uso. Por favor, escolha outro." };
    }
    
    return { success: false, error: "Falha ao salvar as configurações." };
  }
}

export async function togglePieceVisibilityAction(pieceId: string, isPublished: boolean) {
  try {
    await prisma.piece.update({
      where: { id: pieceId },
      data: { isPublished },
    });
    
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/storefront");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao atualizar o status da peça na loja." };
  }
}

export async function updateStorefrontPieceAction(pieceId: string, data: {
  estimatedSalePrice?: number;
  promoPrice?: number | null;
  observations?: string;
  isFeatured?: boolean;
  imageUrl?: string | null;
}) {
  try {
    await prisma.piece.update({
      where: { id: pieceId },
      data: {
        estimatedSalePrice: data.estimatedSalePrice,
        promoPrice: data.promoPrice,
        observations: data.observations,
        isFeatured: data.isFeatured,
      }
    });

    if (data.imageUrl) {
      const existingImages = await prisma.pieceImage.findMany({ where: { pieceId }, orderBy: { order: 'asc' } });
      if (existingImages.length > 0) {
        await prisma.pieceImage.update({
          where: { id: existingImages[0].id },
          data: { imageUrl: data.imageUrl }
        });
      } else {
        await prisma.pieceImage.create({
          data: { pieceId, imageUrl: data.imageUrl, order: 0 }
        });
      }
    }

    revalidatePath("/dashboard/storefront");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao atualizar a peça na vitrine." };
  }
}