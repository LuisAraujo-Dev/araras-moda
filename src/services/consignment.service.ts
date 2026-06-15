
// src/services/consignment.service.ts
import { prisma } from "@/lib/prisma";
import { CreateConsignmentInput, CreateStoreInput } from "@/validators/consignment";
import { ConsignmentStatus, PieceStatus } from "@prisma/client";

export const ConsignmentService = {
  async createStore(companyId: string, data: CreateStoreInput) {
    if (!companyId) throw new Error("A identificação da empresa é obrigatória.");

    return prisma.store.create({
      data: {
        ...data,
        companyId,
      },
    });
  },

  async createConsignment(companyId: string, userId: string, data: CreateConsignmentInput) {
    if (!companyId || !userId) {
      throw new Error("A identificação da empresa e do usuário são obrigatórias.");
    }

    const pieces = await prisma.piece.findMany({
      where: {
        id: { in: data.pieceIds },
        companyId,
      },
    });

    if (pieces.length !== data.pieceIds.length) {
      throw new Error("Uma ou mais peças não foram encontradas ou não pertencem a esta empresa.");
    }

    return prisma.$transaction(async (tx) => {
      const consignment = await tx.consignment.create({
        data: {
          companyId,
          storeId: data.storeId,
          startDate: data.startDate,
          expectedReturnDate: data.expectedReturnDate,
          status: ConsignmentStatus.ACTIVE,
        },
      });

      const consignmentItemsData = pieces.map((piece) => ({
        consignmentId: consignment.id,
        pieceId: piece.id,
        listedPrice: piece.estimatedSalePrice,
      }));

      await tx.consignmentItem.createMany({
        data: consignmentItemsData,
      });

      await tx.piece.updateMany({
        where: { id: { in: data.pieceIds } },
        data: { status: PieceStatus.CONSIGNADA },
      });

      const historyData = pieces.map((piece) => ({
        pieceId: piece.id,
        userId,
        previousStatus: piece.status,
        newStatus: PieceStatus.CONSIGNADA,
        description: `Peça vinculada ao contrato de consignação ${consignment.id}`,
      }));

      await tx.pieceHistory.createMany({
        data: historyData,
      });

      return consignment;
    });
  },
};