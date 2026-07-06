"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Continuamos a usar o placeholder enquanto não implementamos a autenticação real
const MOCK_COMPANY_ID = "company-placeholder-id";

// 1. Buscar as configurações da Loja
export async function getStorefrontConfigAction() {
  try {
    const config = await prisma.storefrontConfig.findUnique({
      where: { companyId: MOCK_COMPANY_ID },
    });
    return { success: true, data: config };
  } catch (error) {
    console.error("Erro ao buscar configuração da vitrine:", error);
    return { success: false, error: "Falha ao carregar a configuração." };
  }
}

// 2. Salvar ou Atualizar as configurações
export async function updateStorefrontConfigAction(data: {
  slug: string;
  description?: string;
  whatsapp?: string;
  instagram?: string;
}) {
  try {
    // O comando upsert é mágico: ele atualiza se já existir, ou cria se for a primeira vez!
    const config = await prisma.storefrontConfig.upsert({
      where: { companyId: MOCK_COMPANY_ID },
      update: {
        slug: data.slug,
        description: data.description,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
      },
      create: {
        companyId: MOCK_COMPANY_ID,
        slug: data.slug,
        description: data.description,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
      },
    });

    // Atualiza o cache da página para mostrar os dados novos imediatamente
    revalidatePath("/dashboard/storefront");
    return { success: true, data: config };
  } catch (error) {
    console.error("Erro ao salvar vitrine:", error);
    return { success: false, error: "Falha ao salvar as configurações." };
  }
}

// 3. Ligar/Desligar a peça na Vitrine
export async function togglePieceVisibilityAction(pieceId: string, isPublished: boolean) {
  try {
    await prisma.piece.update({
      where: { 
        id: pieceId,
        companyId: MOCK_COMPANY_ID // Garante que só altera peças da própria empresa
      },
      data: { isPublished },
    });
    
    // Atualiza tanto o ecrã de estoque quanto o da loja
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/storefront");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar visibilidade da peça:", error);
    return { success: false, error: "Falha ao atualizar o status da peça na loja." };
  }
}