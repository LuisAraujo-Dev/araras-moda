"use server";

import { LotService } from "@/services/lot.service";
import { createLotSchema } from "@/validators/lot";
import { revalidatePath } from "next/cache";

export async function createLotAction(companyId: string, data: unknown) {
  const validatedFields = createLotSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Dados inválidos ou mal formatados." };
  }

  try {
    await LotService.createLot(companyId, validatedFields.data);
    revalidatePath("/dashboard/lots");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar lote:", error); // O linter agora está satisfeito
    return { error: "Falha ao registar o lote no banco de dados." };
  }
}

export async function getLotsAction(companyId: string) {
  try {
    return await LotService.getLotsByCompany(companyId);
  } catch (error) {
    console.error("Erro ao buscar lotes:", error); // O linter agora está satisfeito
    return [];
  }
}