// src/services/piece.service.ts
import { prisma } from "@/lib/prisma";
import { CreatePieceInput } from "@/validators/piece";
import { PieceStatus } from "@prisma/client";

export const PieceService = {
  /**
   * Cria uma nova peça e gera o registro inicial no histórico de auditoria
   */
  async createPiece(companyId: string, userId: string, data: CreatePieceInput) {
    if (!companyId || !userId) {
      throw new Error("Empresa e Usuário são obrigatórios para registrar uma peça.");
    }

    // $transaction garante que ou ambas as tabelas são salvas, ou nenhuma é.
    const piece = await prisma.$transaction(async (tx) => {
      const newPiece = await tx.piece.create({
        data: {
          ...data,
          companyId,
          status: PieceStatus.RECEBIDA, // Status inicial fixo
        },
      });

      // Cria o registro inalterável na linha do tempo
      await tx.pieceHistory.create({
        data: {
          pieceId: newPiece.id,
          userId,
          newStatus: PieceStatus.RECEBIDA,
          description: "Peça cadastrada no sistema.",
        },
      });

      return newPiece;
    });

    return piece;
  },

  /**
   * Move a peça no fluxo de trabalho (Máquina de Status)
   */
  async changePieceStatus(
    companyId: string,
    userId: string,
    pieceId: string,
    newStatus: PieceStatus,
    description?: string
  ) {
    // 1. Busca a peça garantindo que ela pertence à empresa atual
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId, companyId },
    });

    if (!piece) throw new Error("Peça não encontrada.");
    
    // 2. Se o status já for o mesmo, não faz nada (evita poluir o histórico)
    if (piece.status === newStatus) return piece; 

    // 3. Atualiza a peça e grava o rastro de auditoria
    const updatedPiece = await prisma.$transaction(async (tx) => {
      const updated = await tx.piece.update({
        where: { id: pieceId },
        data: { status: newStatus },
      });

      await tx.pieceHistory.create({
        data: {
          pieceId,
          userId,
          previousStatus: piece.status,
          newStatus,
          description: description || `Status alterado de ${piece.status} para ${newStatus}`,
        },
      });

      return updated;
    });

    return updatedPiece;
  }
};