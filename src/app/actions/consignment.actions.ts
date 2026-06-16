"use server";

import { ConsignmentService } from "@/services/consignment.service";
import { createConsignmentSchema } from "@/validators/consignment";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PieceStatus } from "@prisma/client";

export async function createConsignmentAction(companyId: string, userId: string, data: unknown) {
  const validatedFields = createConsignmentSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Dados inválidos. Verifique se selecionou o parceiro e pelo menos uma peça." };
  }

  try {
    await ConsignmentService.createConsignment(companyId, userId, validatedFields.data);
    revalidatePath("/dashboard/consignments");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao registar o contrato de consignação." };
  }
}

export async function getConsignmentsAction(companyId: string) {
  try {
    return await prisma.consignment.findMany({
      where: { companyId },
      include: {
        store: true,
        items: {
          include: {
            piece: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getAvailablePiecesAction(companyId: string) {
  try {
    return await prisma.piece.findMany({
      where: {
        companyId,
        status: PieceStatus.ESTOQUE,
      },
      orderBy: { code: "asc" },
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}