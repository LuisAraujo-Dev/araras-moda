"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getRealCompanyId(providedId: string) {
  if (providedId !== "company-placeholder-id") return providedId;
  const company = await prisma.company.findFirst();
  return company?.id || providedId;
}

export async function getCalendarEventsAction(companyId: string) {
  try {
    const realId = await getRealCompanyId(companyId);
    return await prisma.calendarEvent.findMany({
      where: { companyId: realId },
      orderBy: { startDate: "asc" },
    });
  } catch (error) {
    console.error(error);
    return [];
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