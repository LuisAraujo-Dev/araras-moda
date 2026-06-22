"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ConsignmentStatus } from "@prisma/client";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function getConsignmentsAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    return await prisma.consignment.findMany({
      where: { companyId: realId },
      include: {
        store: true,
        items: {
          include: {
            piece: {
              select: { code: true, name: true }
            }
          }
        },
      },
      orderBy: { startDate: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getStoresAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    return await prisma.store.findMany({
      where: { companyId: realId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getAvailablePiecesAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    return await prisma.piece.findMany({
      where: { companyId: realId },
      select: { id: true, code: true, name: true, purchasePrice: true, estimatedSalePrice: true, tags: true, observations: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

type PieceSelection = {
  id: string;
  status: string; 
  reason: string;
};

type CreateConsignmentInput = {
  storeId: string;
  startDate: Date;
  expectedReturnDate: Date | null;
  status: ConsignmentStatus;
  pieces: PieceSelection[];
  shippingCost?: number;
};

async function processPieceUpdates(realId: string, storeId: string, piecesInput: PieceSelection[]) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  const storeName = store?.name || "Parceiro";

  const pieceIds = piecesInput.map(p => p.id);
  const piecesData = await prisma.piece.findMany({ where: { id: { in: pieceIds } } });
  const pieceMap = new Map(piecesData.map(p => [p.id, p]));

  for (const input of piecesInput) {
    const record = pieceMap.get(input.id);
    if (!record) continue;

    if (input.status === 'ACCEPTED') {
      await prisma.piece.update({
        where: { id: input.id },
        data: { storeId: storeId, status: "CONSIGNADA" }
      });
    } else {
      const newObs = record.observations 
        ? `${record.observations} | [Avaliação] Reprovada em ${storeName}: ${input.reason}`
        : `[Avaliação] Reprovada em ${storeName}: ${input.reason}`;
      
      const tagsSet = new Set(record.tags || []);
      if (input.reason === "Conserto") tagsSet.add("Conserto");
      if (input.reason === "Higienização") tagsSet.add("Higienização");

      await prisma.piece.update({
        where: { id: input.id },
        data: { 
          storeId: null, 
          status: "ESTOQUE",
          observations: newObs,
          tags: Array.from(tagsSet)
        }
      });
    }
  }
}

export async function createConsignmentAction(companyId: string, data: CreateConsignmentInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    const piecesData = await prisma.piece.findMany({ where: { id: { in: data.pieces.map(p => p.id) } } });
    const pieceMap = new Map(piecesData.map(p => [p.id, p]));

    await prisma.consignment.create({
      data: {
        storeId: data.storeId,
        startDate: data.startDate,
        expectedReturnDate: data.expectedReturnDate,
        status: data.status,
        companyId: realId,
        items: {
          create: data.pieces.map(p => {
            const record = pieceMap.get(p.id);
            return {
              pieceId: p.id,
              status: p.status,
              rejectionReason: p.reason || null,
              listedPrice: record?.estimatedSalePrice && record.estimatedSalePrice > 0 ? record.estimatedSalePrice : (record?.purchasePrice || 0)
            };
          })
        }
      },
    });

    await processPieceUpdates(realId, data.storeId, data.pieces);

    if (data.shippingCost && data.shippingCost > 0) {
      const store = await prisma.store.findUnique({ where: { id: data.storeId } });
      await prisma.expense.create({
        data: { 
          amount: data.shippingCost, 
          category: "Uber/99", 
          description: `Envio Consignação: ${store?.name || "Parceiro"}`, 
          date: data.startDate, 
          companyId: realId 
        }
      });
    }

    revalidatePath("/dashboard/consignments");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao criar a remessa de consignação." };
  }
}

export async function updateConsignmentAction(consignmentId: string, companyId: string, data: CreateConsignmentInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    await prisma.consignmentItem.deleteMany({
      where: { consignmentId: consignmentId }
    });

    const piecesData = await prisma.piece.findMany({ where: { id: { in: data.pieces.map(p => p.id) } } });
    const pieceMap = new Map(piecesData.map(p => [p.id, p]));

    await prisma.consignment.update({
      where: { id: consignmentId, companyId: realId },
      data: {
        storeId: data.storeId,
        startDate: data.startDate,
        expectedReturnDate: data.expectedReturnDate,
        status: data.status,
        items: {
          create: data.pieces.map(p => {
            const record = pieceMap.get(p.id);
            return {
              pieceId: p.id,
              status: p.status,
              rejectionReason: p.reason || null,
              listedPrice: record?.estimatedSalePrice && record.estimatedSalePrice > 0 ? record.estimatedSalePrice : (record?.purchasePrice || 0)
            };
          })
        }
      },
    });

    await processPieceUpdates(realId, data.storeId, data.pieces);

    if (data.shippingCost && data.shippingCost > 0) {
      const store = await prisma.store.findUnique({ where: { id: data.storeId } });
      await prisma.expense.create({
        data: { 
          amount: data.shippingCost, 
          category: "Uber/99", 
          description: `Envio Consignação: ${store?.name || "Parceiro"} (Atualizado)`, 
          date: data.startDate, 
          companyId: realId 
        }
      });
    }

    revalidatePath("/dashboard/consignments");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar a remessa." };
  }
}

export async function deleteConsignmentAction(consignmentId: string, companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.consignment.delete({
      where: { id: consignmentId, companyId: realId },
    });
    revalidatePath("/dashboard/consignments");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao excluir a remessa. Verifique se existem peças pendentes de acerto." };
  }
}