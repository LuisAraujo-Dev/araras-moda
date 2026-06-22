//src/app/actions/lot.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SourceType } from "@prisma/client";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function getLotsAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    return await prisma.lot.findMany({
      where: { companyId: realId },
      orderBy: { purchaseDate: "desc" },
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
    const realId = await getRealCompanyId(companyId);
    
    const finalCode = data.code.trim() !== "" 
      ? data.code 
      : `AQ-${Math.floor(100000 + Math.random() * 900000)}`;

    await prisma.lot.create({
      data: {
        code: finalCode,
        purchaseDate: data.purchaseDate,
        sourceName: data.sourceName,
        sourceType: data.sourceType,
        totalCost: data.totalCost,
        quantity: data.quantity,
        notes: data.notes,
        companyId: realId,
      },
    });
    revalidatePath("/dashboard/lots");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao cadastrar a aquisição." };
  }
}

export async function updateLotAction(lotId: string, companyId: string, data: CreateLotInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.lot.update({
      where: { id: lotId, companyId: realId },
      data: {
        code: data.code,
        purchaseDate: data.purchaseDate,
        sourceName: data.sourceName,
        sourceType: data.sourceType,
        totalCost: data.totalCost,
        quantity: data.quantity,
        notes: data.notes,
      },
    });
    revalidatePath("/dashboard/lots");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar a aquisição." };
  }
}

export async function deleteLotAction(lotId: string, companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.lot.delete({
      where: { id: lotId, companyId: realId },
    });
    revalidatePath("/dashboard/lots");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao excluir a aquisição. Verifique se existem peças vinculadas a ela." };
  }
}