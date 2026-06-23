"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function getCalendarPageDataAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    
    const [events, stores, lots] = await Promise.all([
      prisma.calendarEvent.findMany({ where: { companyId: realId }, orderBy: { startDate: "asc" } }),
      prisma.store.findMany({ where: { companyId: realId }, orderBy: { name: "asc" } }),
      prisma.lot.findMany({ where: { companyId: realId }, orderBy: { purchaseDate: "desc" } })
    ]);

    const dynamicTypes = Array.from(new Set(events.map(e => e.type)));
    // Extrai fornecedores únicos baseados nos nomes de origem dos lotes cadastrados
    const suppliers = Array.from(new Set(lots.map(l => l.sourceName))).map(name => ({ name }));

    return { 
      success: true, 
      events, 
      stores: stores.map(s => ({ id: s.id, name: s.name, address: s.address })), 
      lots: lots.map(l => ({ id: l.id, code: l.code, sourceName: l.sourceName })),
      suppliers,
      dynamicTypes 
    };
  } catch (error) {
    console.error(error);
    return { success: false, events: [], stores: [], lots: [], suppliers: [], dynamicTypes: [] };
  }
}

type CalendarEventInput = {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  isAllDay: boolean;
  type: string;
};

export async function createCalendarEventAction(companyId: string, data: CalendarEventInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        isAllDay: data.isAllDay,
        type: data.type,
        companyId: realId,
      },
    });
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao agendar o compromisso." };
  }
}

export async function updateCalendarEventAction(eventId: string, companyId: string, data: CalendarEventInput) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.calendarEvent.update({
      where: { id: eventId, companyId: realId },
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        isAllDay: data.isAllDay,
        type: data.type,
      },
    });
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao atualizar o compromisso." };
  }
}

export async function updateEventDateAction(eventId: string, companyId: string, newDate: Date) {
  try {
    const realId = await getRealCompanyId(companyId);
    const currentEvent = await prisma.calendarEvent.findUnique({ where: { id: eventId, companyId: realId } });
    if (!currentEvent) return { error: "Compromisso não encontrado." };

    const targetDate = new Date(newDate);
    const oldDate = new Date(currentEvent.startDate);
    targetDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    await prisma.calendarEvent.update({
      where: { id: eventId, companyId: realId },
      data: { startDate: targetDate },
    });

    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao mover o compromisso." };
  }
}

export async function deleteCalendarEventAction(eventId: string, companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    await prisma.calendarEvent.delete({
      where: { id: eventId, companyId: realId },
    });
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Falha ao remover o compromisso." };
  }
}