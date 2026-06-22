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

export async function quickAddStoreAction(companyId: string, name: string) {
  const realId = await getRealCompanyId(companyId);
  return prisma.store.create({ data: { name, commissionPercentage: 50, companyId: realId } });
}

type CreateConsignmentInput = {
  storeId: string;
  startDate: Date;
  expectedReturnDate: Date | null;
  status: ConsignmentStatus;
};

export async function createConsignmentAction(companyId: string, data: CreateConsignmentInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.consignment.create({
      data: {
        storeId: data.storeId,
        startDate: data.startDate,
        expectedReturnDate: data.expectedReturnDate,
        status: data.status,
        companyId: realId,
      },
    });
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
    await prisma.consignment.update({
      where: { id: consignmentId, companyId: realId },
      data: {
        storeId: data.storeId,
        startDate: data.startDate,
        expectedReturnDate: data.expectedReturnDate,
        status: data.status,
      },
    });
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
    return { error: "Falha ao excluir a remessa. Verifique se existem peças vinculadas a ela." };
  }
}