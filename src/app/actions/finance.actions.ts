"use server";

import { FinanceService } from "@/services/finance.service";
import { createRevenueSchema, createExpenseSchema } from "@/validators/finance";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PieceStatus } from "@prisma/client";

export async function createRevenueAction(companyId: string, data: unknown) {
  const validatedFields = createRevenueSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Dados de receita inválidos ou incompletos." };
  }

  try {
    await FinanceService.createRevenue(companyId, validatedFields.data);
    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao registar a receita no banco de dados." };
  }
}

export async function createExpenseAction(companyId: string, data: unknown) {
  const validatedFields = createExpenseSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Dados de despesa inválidos ou incompletos." };
  }

  try {
    await FinanceService.createExpense(companyId, validatedFields.data);
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/inventory"); // Atualiza as peças que receberam o rateio
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao registar a despesa no banco de dados." };
  }
}

export async function getRevenuesAction(companyId: string) {
  try {
    return await prisma.revenue.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getExpensesAction(companyId: string) {
  try {
    return await prisma.expense.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Busca peças ativas para podermos selecionar quais receberão o rateio da despesa
export async function getActivePiecesForApportionmentAction(companyId: string) {
  try {
    return await prisma.piece.findMany({
      where: { 
        companyId,
        status: { notIn: [PieceStatus.DOADA, PieceStatus.USO_PESSOAL] }
      },
      select: { id: true, code: true, name: true }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}