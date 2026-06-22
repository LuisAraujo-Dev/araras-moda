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
    
    const [revenues, expenses, pieces, stores] = await Promise.all([
      prisma.revenue.findMany({ where: { companyId: realId }, orderBy: { date: 'desc' } }),
      prisma.expense.findMany({ where: { companyId: realId }, orderBy: { date: 'desc' } }),
      prisma.piece.findMany({ where: { companyId: realId, NOT: { status: 'VENDIDA' } }, orderBy: { code: 'asc' } }),
      prisma.store.findMany({ where: { companyId: realId }, orderBy: { name: 'asc' } })
    ]);

    const transactions = [
      ...revenues.map(r => ({ ...r, kind: 'REVENUE' as const, categoryLabel: r.type })),
      ...expenses.map(e => ({ ...e, kind: 'EXPENSE' as const, categoryLabel: e.category }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalRevenue = revenues.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalRevenue - totalExpense;

    const dynamicRevenueCats = Array.from(new Set(revenues.map(r => r.type)));
    const dynamicExpenseCats = Array.from(new Set(expenses.map(e => e.category)));

    return { 
      transactions, 
      totalRevenue, 
      totalExpense, 
      balance, 
      dynamicRevenueCats, 
      dynamicExpenseCats,
      pieces: pieces.map(p => ({ id: p.id, code: p.code, name: p.name })),
      stores: stores.map(s => ({ id: s.id, name: s.name }))
    };
  } catch (error) {
    console.error(error);
    return { transactions: [], totalRevenue: 0, totalExpense: 0, balance: 0, dynamicRevenueCats: [], dynamicExpenseCats: [], pieces: [], stores: [] };
  }
}

type TransactionInput = {
  kind: 'REVENUE' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  date: Date;
  pieceId?: string | null;
  saleType?: string | null; // 'OWN' ou 'PARTNER'
  storeId?: string | null;
};

export async function createTransactionAction(companyId: string, data: TransactionInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    if (data.kind === 'REVENUE') {
      let finalDescription = data.description;

      if (data.category === 'Venda' && data.pieceId) {
        const piece = await prisma.piece.findUnique({ where: { id: data.pieceId } });
        if (piece) {
          const prefix = data.saleType === 'OWN' ? '[Venda Própria]' : '[Venda Parceiro]';
          finalDescription = `${prefix} Peça ${piece.code} - ${piece.name} | ${data.description}`;
          
          await prisma.piece.update({
            where: { id: data.pieceId },
            data: {
              status: "VENDIDA",
              tags: ["Vendida"], 
              storeId: data.saleType === 'OWN' ? null : (data.storeId || piece.storeId)
            }
          });
        }
      }

      await prisma.revenue.create({
        data: {
          amount: data.amount,
          type: data.category,
          description: finalDescription,
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