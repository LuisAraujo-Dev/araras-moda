"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function getBusinessStatsAction() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return { success: false, error: "Não autorizado" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { success: false, error: "Utilizador não encontrado" };

    const companyId = user.companyId;

    // Busca todas as peças com suas relações
    const pieces = await prisma.piece.findMany({
      where: { companyId },
      include: { category: true, lot: true, store: true },
    });

    if (pieces.length === 0) {
      return { success: true, isEmpty: true };
    }

    // 1. Visão Global
    const totalPieces = pieces.length;
    const totalInvested = pieces.reduce((acc, p) => acc + p.purchasePrice, 0);
    const expectedRevenue = pieces.reduce((acc, p) => acc + (p.promoPrice || p.estimatedSalePrice), 0);
    const potentialProfit = expectedRevenue - totalInvested;
    const averageMargin = totalInvested > 0 ? ((potentialProfit / totalInvested) * 100).toFixed(1) : 0;

    // 2. Análise de Categorias (Quantidade e Lucro)
    const categoryStats: Record<string, { name: string, count: number, cost: number, revenue: number }> = {};
    pieces.forEach(p => {
      const catName = p.category?.name || "Sem categoria";
      if (!categoryStats[catName]) categoryStats[catName] = { name: catName, count: 0, cost: 0, revenue: 0 };
      categoryStats[catName].count += 1;
      categoryStats[catName].cost += p.purchasePrice;
      categoryStats[catName].revenue += (p.promoPrice || p.estimatedSalePrice);
    });

    const topCategories = Object.values(categoryStats).map(c => {
      const profit = c.revenue - c.cost;
      const margin = c.cost > 0 ? (profit / c.cost) * 100 : 100;
      return { ...c, profit, margin };
    }).sort((a, b) => b.profit - a.profit); // Ordena pelas que dão mais lucro

    // 3. Melhores Origens/Lotes (Menor Custo Médio)
    const originStats: Record<string, { name: string, count: number, totalCost: number }> = {};
    pieces.forEach(p => {
      const lotName = p.lot?.sourceName || "Desconhecida";
      if (!originStats[lotName]) originStats[lotName] = { name: lotName, count: 0, totalCost: 0 };
      originStats[lotName].count += 1;
      originStats[lotName].totalCost += p.purchasePrice;
    });

    const bestOrigins = Object.values(originStats).map(o => {
      const avgCost = o.totalCost / o.count;
      return { ...o, avgCost };
    }).sort((a, b) => a.avgCost - b.avgCost); // Ordena pelo menor custo de aquisição

    // 4. Análise de Parceiros (Peças em Consignação)
    const partnerStats: Record<string, { name: string, count: number, expectedRevenue: number }> = {};
    pieces.filter(p => p.tags.includes("Em consignação")).forEach(p => {
      const storeName = p.store?.name || "Em trânsito";
      if (!partnerStats[storeName]) partnerStats[storeName] = { name: storeName, count: 0, expectedRevenue: 0 };
      partnerStats[storeName].count += 1;
      partnerStats[storeName].expectedRevenue += (p.promoPrice || p.estimatedSalePrice);
    });

    const topPartners = Object.values(partnerStats).sort((a, b) => b.expectedRevenue - a.expectedRevenue);

    return {
      success: true,
      isEmpty: false,
      data: {
        overview: { totalPieces, totalInvested, expectedRevenue, potentialProfit, averageMargin },
        topCategories: topCategories.slice(0, 5), // Pega o Top 5
        bestOrigins: bestOrigins.slice(0, 5),     // Pega o Top 5 origens mais baratas
        topPartners
      }
    };
  } catch (error) {
    console.error("Erro ao gerar estatísticas:", error);
    return { success: false, error: "Falha ao gerar relatórios." };
  }
}