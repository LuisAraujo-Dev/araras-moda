//src/app/actions/consignment.actions.ts
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
              select: { code: true, name: true, purchasePrice: true }
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

async function processPieceUpdates(realId: string, storeId: string, piecesInput: PieceSelection[], consignmentStatus: ConsignmentStatus) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  const storeName = store?.name || "Parceiro";

  const pieceIds = piecesInput.map(p => p.id);
  const piecesData = await prisma.piece.findMany({ where: { id: { in: pieceIds } } });
  const pieceMap = new Map(piecesData.map(p => [p.id, p]));

  for (const input of piecesInput) {
    const record = pieceMap.get(input.id);
    
    if (!record || record.status === 'VENDIDA') continue;

    let newStatus = record.status;
    let newStoreId = record.storeId;
    let newObs = record.observations;
    const tagsSet = new Set(record.tags || []);

    if (consignmentStatus === 'FINISHED') {
      newStatus = "ESTOQUE";
      newStoreId = null;
      tagsSet.delete("Em consignação");
      tagsSet.add("Em estoque");
    } else {
      if (input.status === 'ACCEPTED') {
        newStatus = "CONSIGNADA";
        newStoreId = storeId;
        tagsSet.delete("Em estoque");
        tagsSet.add("Em consignação");
      } else {
        newStatus = "ESTOQUE";
        newStoreId = null;
        tagsSet.delete("Em consignação");
        tagsSet.add("Em estoque");
        
        if (input.reason) {
          if (input.reason === "Conserto" || input.reason === "Higienização") {
            tagsSet.add(input.reason);
          }
          newObs = record.observations 
            ? `${record.observations} | [Avaliação] Reprovada em ${storeName}: ${input.reason}`
            : `[Avaliação] Reprovada em ${storeName}: ${input.reason}`;
        }
      }
    }

    await prisma.piece.update({
      where: { id: input.id },
      data: { 
        storeId: newStoreId, 
        status: newStatus,
        observations: newObs,
        tags: Array.from(tagsSet)
      }
    });
  }
}

export async function createConsignmentAction(companyId: string, data: CreateConsignmentInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    const piecesData = await prisma.piece.findMany({ where: { id: { in: data.pieces.map(p => p.id) } } });
    const pieceMap = new Map(piecesData.map(p => [p.id, p]));

    const consignment = await prisma.consignment.create({
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

    await processPieceUpdates(realId, data.storeId, data.pieces, data.status);

    if (data.shippingCost && data.shippingCost > 0) {
      const store = await prisma.store.findUnique({ where: { id: data.storeId } });
      await prisma.expense.create({
        data: { 
          amount: data.shippingCost, 
          category: "Logística", 
          description: `Transporte Remessa #${consignment.id.substring(0,8)}: ${store?.name || "Parceiro"}`, 
          date: data.startDate, 
          companyId: realId 
        }
      });
    }

    revalidatePath("/dashboard/consignments");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao criar a remessa." };
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

    await processPieceUpdates(realId, data.storeId, data.pieces, data.status);

    if (data.shippingCost && data.shippingCost > 0) {
      const store = await prisma.store.findUnique({ where: { id: data.storeId } });
      await prisma.expense.create({
        data: { 
          amount: data.shippingCost, 
          category: "Logística", 
          description: `Transporte Remessa #${consignmentId.substring(0,8)}: ${store?.name || "Parceiro"} (Atualizado)`, 
          date: data.startDate, 
          companyId: realId 
        }
      });
    }

    revalidatePath("/dashboard/consignments");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao atualizar a remessa." };
  }
}

export async function deleteConsignmentAction(consignmentId: string, companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    const items = await prisma.consignmentItem.findMany({
      where: { consignmentId },
      include: { piece: true }
    });

    for (const item of items) {
      if (item.piece.status !== 'VENDIDA') {
        const tagsSet = new Set(item.piece.tags || []);
        tagsSet.delete("Em consignação");
        tagsSet.add("Em estoque");

        await prisma.piece.update({
          where: { id: item.pieceId },
          data: { status: 'ESTOQUE', storeId: null, tags: Array.from(tagsSet) }
        });
      }
    }

    await prisma.consignment.delete({
      where: { id: consignmentId, companyId: realId },
    });
    
    revalidatePath("/dashboard/consignments");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao excluir a remessa." };
  }
}