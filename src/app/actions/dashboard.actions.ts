"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getRealCompanyId() {
  const company = await prisma.company.findFirst();
  return company?.id || "company-placeholder-id";
}

export async function getDashboardDataAction() {
  try {
    const realId = await getRealCompanyId();
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const nextWeek = new Date(startOfToday);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [user, piecesCount, consignments, revenues, expenses, todayEvents] = await Promise.all([
      prisma.user.findFirst({ where: { companyId: realId } }),
      prisma.piece.count({ where: { companyId: realId, status: { in: ['ESTOQUE', 'CONSIGNADA'] } } }),
      prisma.consignment.findMany({ 
        where: { companyId: realId, status: 'ACTIVE' },
        include: { store: true, _count: { select: { items: true } } }
      }),
      prisma.revenue.findMany({ where: { companyId: realId } }),
      prisma.expense.findMany({ where: { companyId: realId } }),
      prisma.calendarEvent.findMany({ 
        where: { companyId: realId, startDate: { gte: startOfToday, lte: endOfToday } },
        orderBy: { startDate: 'asc' }
      })
    ]);

    const balance = revenues.reduce((acc, r) => acc + r.amount, 0) - expenses.reduce((acc, e) => acc + e.amount, 0);

    const expiringConsignments = consignments.filter(c => 
      c.expectedReturnDate && new Date(c.expectedReturnDate) <= nextWeek
    ).sort((a, b) => {
      if (!a.expectedReturnDate || !b.expectedReturnDate) return 0;
      return new Date(a.expectedReturnDate).getTime() - new Date(b.expectedReturnDate).getTime();
    });

    // Pega apenas o primeiro nome do utilizador (Ex: "Luis")
    const firstName = user?.name ? user.name.split(" ")[0] : "Gestor";

    return {
      success: true,
      data: {
        userName: firstName,
        kpis: {
          activePieces: piecesCount,
          activeConsignments: consignments.length,
          balance
        },
        todayEvents,
        expiringConsignments
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao carregar os dados do painel principal." };
  }
}

export async function toggleEventCompletionAction(eventId: string, isCompleted: boolean) {
  try {
    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: { isCompleted }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar o evento." };
  }
}