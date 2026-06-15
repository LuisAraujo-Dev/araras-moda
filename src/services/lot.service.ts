import { prisma } from "@/lib/prisma";
import { CreateLotInput } from "@/validators/lot";

export const LotService = {
  /**
   * Cria um novo Lote garantindo a vinculação Multi-Tenant
   */
  async createLot(companyId: string, data: CreateLotInput) {
    if (!companyId) {
      throw new Error("O ID da empresa é obrigatório para registrar um lote.");
    }

    const lot = await prisma.lot.create({
      data: {
        ...data,
        companyId,
      },
    });

    return lot;
  },

  /**
   * Busca todos os lotes de uma empresa específica
   */
  async getLotsByCompany(companyId: string) {
    if (!companyId) throw new Error("Acesso negado: Empresa não identificada.");

    return prisma.lot.findMany({
      where: { companyId },
      orderBy: { purchaseDate: "desc" },
    });
  },

  /**
   * Busca os detalhes de um lote específico (com validação de isolamento)
   */
  async getLotById(companyId: string, lotId: string) {
    return prisma.lot.findFirst({
      where: {
        id: lotId,
        companyId, // Garante que a empresa A não veja o lote da empresa B
      },
    });
  }
};