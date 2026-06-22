"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function getFinancialDataAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    const [revenues, expenses] = await Promise.all([
      prisma.revenue.findMany({ where: { companyId: realId }, orderBy: { date: 'desc' } }),
      prisma.expense.findMany({ where: { companyId: realId }, orderBy: { date: 'desc' } })
    ]);

    const transactions = [
      ...revenues.map(r => ({ ...r, kind: 'REVENUE' as const, categoryLabel: r.type })),
      ...expenses.map(e => ({ ...e, kind: 'EXPENSE' as const, categoryLabel: e.category }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalRevenue = revenues.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalRevenue - totalExpense;

    // Extrair categorias únicas já usadas
    const dynamicRevenueCats = Array.from(new Set(revenues.map(r => r.type)));
    const dynamicExpenseCats = Array.from(new Set(expenses.map(e => e.category)));

    return { transactions, totalRevenue, totalExpense, balance, dynamicRevenueCats, dynamicExpenseCats };
  } catch (error) {
    console.error(error);
    return { transactions: [], totalRevenue: 0, totalExpense: 0, balance: 0, dynamicRevenueCats: [], dynamicExpenseCats: [] };
  }
}

type TransactionInput = {
  kind: 'REVENUE' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  date: Date;
};

export async function createTransactionAction(companyId: string, data: TransactionInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    if (data.kind === 'REVENUE') {
      await prisma.revenue.create({
        data: {
          amount: data.amount,
          type: data.category,
          description: data.description,
          date: data.date,
          companyId: realId,
        }
      });
    } else {
      await prisma.expense.create({
        data: {
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date,
          companyId: realId,
        }
      });
    }
    
    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao registar a transação." };
  }
}

export async function updateTransactionAction(id: string, companyId: string, data: TransactionInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    if (data.kind === 'REVENUE') {
      await prisma.revenue.update({
        where: { id, companyId: realId },
        data: {
          amount: data.amount,
          type: data.category,
          description: data.description,
          date: data.date,
        }
      });
    } else {
      await prisma.expense.update({
        where: { id, companyId: realId },
        data: {
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date,
        }
      });
    }
    
    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar a transação." };
  }
}

export async function deleteTransactionAction(id: string, kind: 'REVENUE' | 'EXPENSE', companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    if (kind === 'REVENUE') {
      await prisma.revenue.delete({ where: { id, companyId: realId } });
    } else {
      await prisma.expense.delete({ where: { id, companyId: realId } });
    }
    
    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao excluir a transação." };
  }
}