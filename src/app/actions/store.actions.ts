"use server";

import { ConsignmentService } from "@/services/consignment.service";
import { createStoreSchema } from "@/validators/consignment";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createStoreAction(companyId: string, data: unknown) {
  const validatedFields = createStoreSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Dados inválidos ou comissão fora do limite de 0 a 100." };
  }

  try {
    await ConsignmentService.createStore(companyId, validatedFields.data);
    revalidatePath("/dashboard/stores");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao registar o parceiro no banco de dados." };
  }
}

export async function getStoresAction(companyId: string) {
  try {
    return await prisma.store.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}