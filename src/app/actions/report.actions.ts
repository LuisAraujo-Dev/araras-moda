"use server";

import { prisma } from "@/lib/prisma";
import { PieceStatus } from "@prisma/client";

export async function getStagnantInventoryReportAction(companyId: string) {
  // Calcula a data de 90 dias atrás
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  try {
    return await prisma.piece.findMany({
      where: {
        companyId,
        status: PieceStatus.ESTOQUE,
        createdAt: {
          lte: ninetyDaysAgo, // Menor ou igual a 90 dias atrás
        },
      },
      include: {
        category: true,
        brand: true,
        lot: true,
      },
      orderBy: {
        createdAt: "asc", // As mais antigas primeiro
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de estoque parado:", error);
    return [];
  }
}   