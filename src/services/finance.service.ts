import { prisma } from "@/lib/prisma";
import { CreateRevenueInput, CreateExpenseInput } from "@/validators/finance";

export const FinanceService = {
  async createRevenue(companyId: string, data: CreateRevenueInput) {
    if (!companyId) throw new Error("A identificação da empresa é obrigatória.");

    return prisma.revenue.create({
      data: {
        ...data,
        companyId,
      },
    });
  },

  async createExpense(companyId: string, data: CreateExpenseInput) {
    if (!companyId) throw new Error("A identificação da empresa é obrigatória.");

    const { pieceIdsToApportion, ...expenseData } = data;
    const isApportioned = pieceIdsToApportion && pieceIdsToApportion.length > 0;

    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          ...expenseData,
          companyId,
          isApportioned: !!isApportioned,
        },
      });

      if (isApportioned && pieceIdsToApportion) {
        const pieceCount = pieceIdsToApportion.length;
        const amountPerPiece = expenseData.amount / pieceCount;

        const apportionmentData = pieceIdsToApportion.map((pieceId) => ({
          expenseId: expense.id,
          pieceId,
          amount: amountPerPiece,
        }));

        await tx.expenseApportionment.createMany({
          data: apportionmentData,
        });
      }

      return expense;
    });
  },
};