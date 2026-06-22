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
              select: { code: true, name: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
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
      select: { id: true, code: true, name: true, purchasePrice: true, estimatedSalePrice: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

type CreateConsignmentInput = {
  storeId: string;
  startDate: Date;
  expectedReturnDate: Date | null;
  status: ConsignmentStatus;
  pieceIds: string[];
};

export async function createConsignmentAction(companyId: string, data: CreateConsignmentInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    const pieces = await prisma.piece.findMany({
      where: { id: { in: data.pieceIds }, companyId: realId }
    });

    await prisma.consignment.create({
      data: {
        storeId: data.storeId,
        startDate: data.startDate,
        expectedReturnDate: data.expectedReturnDate,
        status: data.status,
        companyId: realId,
        items: {
          create: pieces.map(p => ({
            pieceId: p.id,
            listedPrice: p.estimatedSalePrice > 0 ? p.estimatedSalePrice : p.purchasePrice
          }))
        }
      },
    });

    if (data.pieceIds.length > 0) {
      await prisma.piece.updateMany({
        where: { id: { in: data.pieceIds }, companyId: realId },
        data: { storeId: data.storeId, status: "CONSIGNADA" }
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

    const pieces = await prisma.piece.findMany({
      where: { id: { in: data.pieceIds }, companyId: realId }
    });

    await prisma.consignment.update({
      where: { id: consignmentId, companyId: realId },
      data: {
        storeId: data.storeId,
        startDate: data.startDate,
        expectedReturnDate: data.expectedReturnDate,
        status: data.status,
        items: {
          create: pieces.map(p => ({
            pieceId: p.id,
            listedPrice: p.estimatedSalePrice > 0 ? p.estimatedSalePrice : p.purchasePrice
          }))
        }
      },
    });

    if (data.pieceIds.length > 0) {
      await prisma.piece.updateMany({
        where: { id: { in: data.pieceIds }, companyId: realId },
        data: { storeId: data.storeId, status: "CONSIGNADA" }
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