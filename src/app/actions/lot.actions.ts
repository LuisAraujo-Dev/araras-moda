"use server";

import { prisma } from "@/lib/prisma";
import { SourceType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getLotsAction(companyId: string) {
  try {
    const lots = await prisma.lot.findMany({
      where: { companyId },
      include: {
        pieces: true
      },
      orderBy: { purchaseDate: 'desc' }
    });

    return lots.map(lot => {
      const { pieces, ...lotData } = lot;
      
      const registeredPieces = pieces.length;
      
      const soldPieces = pieces.filter(p => p.status === "VENDIDA").length;
      
      const expectedRevenue = pieces.reduce((acc, p) => {
        return acc + (p.promoPrice || p.estimatedSalePrice || 0);
      }, 0);

      const averageCost = lotData.quantity > 0 ? lotData.totalCost / lotData.quantity : 0;
      
      const expectedProfit = expectedRevenue - lotData.totalCost;
      
      return {
        ...lotData,
        registeredPieces,
        soldPieces,
        expectedRevenue,
        averageCost,
        expectedProfit
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

type CreateLotInput = {
  code: string;
  purchaseDate: Date;
  sourceName: string;
  sourceType: SourceType;
  totalCost: number;
  quantity: number;
  notes: string;
};

export async function createLotAction(companyId: string, data: CreateLotInput) {
  try {
    const autoCode = data.code || `LOTE-${new Date().getTime().toString().slice(-6)}`;
    
    await prisma.lot.create({
      data: { ...data, code: autoCode, companyId }
    });
    
    revalidatePath("/dashboard/lots");
    return { success: true };
  } catch {
    return { success: false, error: "Falha ao criar o lote." };
  }
}

export async function updateLotAction(id: string, companyId: string, data: CreateLotInput) {
  try {
    await prisma.lot.update({
      where: { id, companyId },
      data
    });
    
    revalidatePath("/dashboard/lots");
    return { success: true };
  } catch {
    return { success: false, error: "Falha ao atualizar." };
  }
}

export async function deleteLotAction(id: string, companyId: string) {
  try {
    const lot = await prisma.lot.findUnique({ 
      where: { id, companyId }, 
      include: { _count: { select: { pieces: true } } } 
    });
    
    if (lot && lot._count.pieces > 0) {
      return { success: false, error: "Não é possível excluir: existem peças no estoque vinculadas." };
    }
    
    await prisma.lot.delete({ where: { id, companyId } });
    
    revalidatePath("/dashboard/lots");
    return { success: true };
  } catch {
    return { success: false, error: "Falha ao excluir." };
  }
}