//src/app/actions/store.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function getStoresAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    return await prisma.store.findMany({
      where: { companyId: realId },
      include: {
        _count: {
          select: { pieces: true, consignments: true }
        }
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

type StoreInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
  commissionPercentage: number;
  notes: string;
};

export async function createStoreAction(companyId: string, data: StoreInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.store.create({
      data: {
        ...data,
        companyId: realId,
      },
    });
    revalidatePath("/dashboard/stores");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao cadastrar o parceiro." };
  }
}

export async function updateStoreAction(storeId: string, companyId: string, data: StoreInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.store.update({
      where: { id: storeId, companyId: realId },
      data,
    });
    revalidatePath("/dashboard/stores");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar o parceiro." };
  }
}

export async function deleteStoreAction(storeId: string, companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.store.delete({
      where: { id: storeId, companyId: realId },
    });
    revalidatePath("/dashboard/stores");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao excluir o parceiro. Verifique se existem peças ou remessas vinculadas a ele." };
  }
}