"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

// Função segura que força o uso da empresa do dono da sessão!
async function getValidCompanyId() {
  const session = await getServerSession();
  
  if (!session?.user?.email) throw new Error("Não autorizado");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new Error("Utilizador não encontrado");
  
  return user.companyId;
}

export async function getStorefrontConfigAction() {
  try {
    const companyId = await getValidCompanyId();
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
    const companyId = await getValidCompanyId();

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
    const companyId = await getValidCompanyId();
    
    await prisma.piece.update({
      where: { 
        id: pieceId,
        companyId 
      },
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