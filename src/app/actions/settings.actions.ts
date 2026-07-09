"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

// Busca os dados baseados na pessoa que está logada
export async function getSettingsDataAction() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return { success: false, error: "Não autorizado" };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return { success: false, error: "Utilizador não encontrado" };

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    });

    return { success: true, company, user };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao carregar configurações." };
  }
}

export async function updateCompanyAction(name: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return { success: false, error: "Não autorizado" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { success: false, error: "Utilizador não encontrado" };

    if (!name || name.trim() === "") return { success: false, error: "O nome da empresa não pode estar vazio." };

    await prisma.company.update({
      where: { id: user.companyId },
      data: { name },
    });
    
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard", "layout"); // Atualiza o nome no menu lateral
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao atualizar os dados da empresa." };
  }
}

export async function updateUserProfileAction(name: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return { success: false, error: "Não autorizado" };

    if (!name || name.trim() === "") return { success: false, error: "O nome não pode estar vazio." };

    await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
    });
    
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard", "layout"); // Atualiza a inicial no menu lateral
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao atualizar o perfil." };
  }
}

// Nova ação de exclusão em cascata
export async function deleteAccountAction() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return { success: false, error: "Não autorizado" };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return { success: false, error: "Utilizador não encontrado" };

    // Apagar a Empresa causa um efeito cascata que apaga o Utilizador, Peças, Lotes, etc.
    await prisma.company.delete({
      where: { id: user.companyId }
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return { success: false, error: "Falha ao excluir a conta." };
  }
}