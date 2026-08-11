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
    console.error("Erro ao buscar configuração da vitrine:", error);
    return { success: false, error: "Falha ao carregar a configuração." };
  }
}

export async function updateStorefrontConfigAction(data: {
  slug: string;
  description?: string;
  whatsapp?: string;
  instagram?: string;
}) {
  try {
    const companyId = await getRealCompanyId();

    const config = await prisma.storefrontConfig.upsert({
      where: { companyId },
      update: {
        slug: data.slug,
        description: data.description,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
      },
      create: {
        companyId,
        slug: data.slug,
        description: data.description,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
      },
    });

    revalidatePath("/dashboard/storefront");
    return { success: true, data: config };
  } catch (error) {
    console.error("Erro ao salvar vitrine:", error);
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
    console.error("Erro ao alterar visibilidade da peça:", error);
    return { success: false, error: "Falha ao atualizar o status da peça na loja." };
  }
}