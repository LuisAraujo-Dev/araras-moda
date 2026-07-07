"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

export async function checkOnboardingStatusAction() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) return { success: false, redirect: false };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!user) return { success: false, redirect: false };

    const needsSetup = user.company.name === "Pendente" || user.company.name === "";

    return { 
      success: true, 
      needsSetup,
      userName: user.name,
      companyId: user.companyId // Agora devolvemos a ID real da empresa do utilizador!
    };
  } catch (error) {
    console.error("Erro ao verificar status do onboarding:", error);
    return { success: false, redirect: false };
  }
}

export async function completeSetupAction(data: { companyName: string, businessType: string }) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return { success: false, error: "Não autorizado" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return { success: false, error: "Utilizador não encontrado" };

    await prisma.company.update({
      where: { id: user.companyId },
      data: { name: data.companyName }
    });

    revalidatePath("/dashboard", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao completar o setup:", error);
    return { success: false, error: "Falha ao salvar configurações iniciais" };
  }
}