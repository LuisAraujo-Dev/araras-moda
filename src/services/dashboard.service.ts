import { prisma } from "@/lib/prisma";
import { PieceStatus } from "@prisma/client";

export const DashboardService = {
  /**
   * Retorna os principais indicadores (KPIs) para a tela inicial do sistema
   */
  async getOverviewMetrics(companyId: string) {
    if (!companyId) throw new Error("A identificação da empresa é obrigatória.");

    // 1. Contagem rápida de peças agrupadas por status
    const pieceCounts = await prisma.piece.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
    });

    // Função utilitária para extrair a contagem do array retornado pelo Prisma
    const getCount = (status: PieceStatus) =>
      pieceCounts.find((p) => p.status === status)?._count.id || 0;

    const inStock = getCount(PieceStatus.ESTOQUE);
    const consigned = getCount(PieceStatus.CONSIGNADA);
    const sold = getCount(PieceStatus.VENDIDA);

    // 2. Resumo Financeiro Global (Receitas vs Despesas)
    const totalRevenue = await prisma.revenue.aggregate({
      where: { companyId },
      _sum: { amount: true },
    });

    const totalExpense = await prisma.expense.aggregate({
      where: { companyId },
      _sum: { amount: true },
    });

    const revenueAmount = totalRevenue._sum.amount || 0;
    const expenseAmount = totalExpense._sum.amount || 0;
    const profit = revenueAmount - expenseAmount;

    // 3. Sistema de Alertas: Peças paradas no estoque há mais de 90 dias
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const stagnantPieces = await prisma.piece.count({
      where: {
        companyId,
        status: PieceStatus.ESTOQUE,
        updatedAt: { lt: ninetyDaysAgo }, // 'lt' significa "less than" (menor/anterior a)
      },
    });

    return {
      inventory: {
        inStock,
        consigned,
        sold,
        stagnant: stagnantPieces,
      },
      finance: {
        totalRevenue: revenueAmount,
        totalExpense: expenseAmount,
        netProfit: profit,
      },
    };
  },

  /**
   * Utilitário Financeiro: Calcula o lucro individual de uma peça específica
   * Fórmula: Receita (Preço de Venda) - Custo de Compra - Despesas Rateadas
   */
  async getPieceProfitability(companyId: string, pieceId: string) {
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId, companyId },
      include: {
        apportionments: true, // Traz os rateios (ex: lavanderia, costureira)
        consignmentItems: true, // Traz dados de comissão caso tenha sido consignada
      },
    });

    if (!piece) throw new Error("Peça não encontrada.");

    // Soma os custos extras que foram rateados para esta peça
    const apportionedCosts = piece.apportionments.reduce(
      (sum, app) => sum + app.amount, 0
    );

    // Custo Total = Preço de compra (pago no garimpo) + Custos extras
    const totalCost = piece.purchasePrice + apportionedCosts;

    // Se foi vendida por consignação, a receita é o valor líquido (após comissão). 
    // Senão, é o preço de venda estimado original.
    let finalRevenue = piece.estimatedSalePrice;
    
    if (piece.status === PieceStatus.VENDIDA && piece.consignmentItems.length > 0) {
      // Pega o último registro de consignação
      const lastConsignment = piece.consignmentItems[piece.consignmentItems.length - 1];
      if (lastConsignment.netValue) {
        finalRevenue = lastConsignment.netValue;
      }
    }

    const profit = finalRevenue - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0; // Retorno sobre Investimento

    return {
      totalCost,
      finalRevenue,
      profit,
      roiPercentage: Number(roi.toFixed(2)),
    };
  }
};