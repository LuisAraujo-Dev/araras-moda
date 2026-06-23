"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function getSettingsDataAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    const company = await prisma.company.findUnique({ 
      where: { id: realId } 
    });
    
    // Como estamos a usar um mock, vamos buscar o primeiro utilizador desta empresa
    const user = await prisma.user.findFirst({ 
      where: { companyId: realId } 
    });

    return { success: true, company, user };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao carregar configurações." };
  }
}

export async function updateCompanyAction(companyId: string, name: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    if (!name || name.trim() === "") return { error: "O nome da empresa não pode estar vazio." };

    await prisma.company.update({
      where: { id: realId },
      data: { name },
    });
    
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard"); // Atualiza o nome no menu lateral se necessário
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar os dados da empresa." };
  }
}

export async function updateUserProfileAction(userId: string, name: string) {
  try {
    if (!name || name.trim() === "") return { error: "O nome não pode estar vazio." };

    await prisma.user.update({
      where: { id: userId },
      data: { name },
    });
    
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar o perfil." };
  }
}