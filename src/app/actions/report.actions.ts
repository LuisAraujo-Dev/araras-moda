"use server";

import { prisma } from "@/lib/prisma";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function getReportsAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);

    // 1. Buscar todos os dados base
    const [pieces, revenues, expenses] = await Promise.all([
      prisma.piece.findMany({ where: { companyId: realId }, select: { status: true, purchasePrice: true, estimatedSalePrice: true, storeId: true } }),
      prisma.revenue.findMany({ where: { companyId: realId }, select: { amount: true, type: true } }),
      prisma.expense.findMany({ where: { companyId: realId }, select: { amount: true, category: true } }),
    ]);

    // 2. Processar Dados Financeiros
    const totalRevenue = revenues.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalRevenue - totalExpense;

    const expensesByCategory = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const revenuesByType = revenues.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    // Formatar para arrays ordenados
    const sortedExpenses = Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const sortedRevenues = Object.entries(revenuesByType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 3. Processar Dados de Estoque
    const totalPieces = pieces.length;
    let inStock = 0;
    let consigned = 0;
    let sold = 0;
    let other = 0;
    let inventoryCost = 0; // Dinheiro empatado em peças não vendidas

    pieces.forEach(p => {
      if (p.status === 'ESTOQUE') {
        inStock++;
        inventoryCost += p.purchasePrice;
      } else if (p.status === 'CONSIGNADA' || p.storeId) {
        consigned++;
        inventoryCost += p.purchasePrice;
      } else if (p.status === 'VENDIDA') {
        sold++;
      } else {
        other++;
        // Não somamos custo de doadas/descartadas ao estoque ativo
      }
    });

    return {
      success: true,
      data: {
        financials: {
          revenue: totalRevenue,
          expense: totalExpense,
          balance: balance,
          expensesByCategory: sortedExpenses,
          revenuesByType: sortedRevenues,
        },
        inventory: {
          total: totalPieces,
          inStock,
          consigned,
          sold,
          other,
          activeInventoryCost: inventoryCost,
        }
      }
    };

  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao gerar os relatórios." };
  }
}