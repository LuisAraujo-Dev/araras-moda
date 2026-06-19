"use server";

import { DashboardService } from "@/services/dashboard.service";

export async function getDashboardMetricsAction(companyId: string) {
  try {
    return await DashboardService.getOverviewMetrics(companyId);
  } catch (error) {
    console.error("Erro ao buscar métricas do dashboard:", error);
    return null;
  }
}