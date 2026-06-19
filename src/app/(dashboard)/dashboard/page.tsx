"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Handshake, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { getDashboardMetricsAction } from "@/app/actions/dashboard.actions";

type DashboardMetrics = {
  inventory: {
    inStock: number;
    consigned: number;
    sold: number;
    stagnant: number;
  };
  finance: {
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
  };
};

export default function DashboardPage() {
  const mockCompanyId = "company-placeholder-id";
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    const data = await getDashboardMetricsAction(mockCompanyId);
    if (data) {
      setMetrics(data as DashboardMetrics);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      await loadMetrics();
    };
    fetchInitialData();
  }, [loadMetrics]);

  if (loading || !metrics) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-sm font-medium">A processar indicadores da operação...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Visão Geral</h1>
        <p className="text-zinc-500">Acompanhe os indicadores em tempo real da sua operação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Estoque */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Estoque Físico</CardTitle>
            <Package className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-950">{metrics.inventory.inStock}</div>
            <p className="text-xs text-zinc-500">Peças prontas para venda</p>
          </CardContent>
        </Card>

        {/* Consignações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Consignado</CardTitle>
            <Handshake className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-950">{metrics.inventory.consigned}</div>
            <p className="text-xs text-zinc-500">Peças em parceiros externos</p>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Lucro Líquido Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.finance.netProfit >= 0 ? 'text-zinc-950' : 'text-rose-600'}`}>
              {formatCurrency(metrics.finance.netProfit)}
            </div>
            <p className="text-xs text-zinc-500">Receitas ({formatCurrency(metrics.finance.totalRevenue)}) - Despesas</p>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className={metrics.inventory.stagnant > 0 ? "border-amber-200 bg-amber-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${metrics.inventory.stagnant > 0 ? "text-amber-700" : "text-zinc-500"}`}>
              Alertas Críticos
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${metrics.inventory.stagnant > 0 ? "text-amber-500" : "text-zinc-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.inventory.stagnant > 0 ? "text-amber-700" : "text-zinc-950"}`}>
              {metrics.inventory.stagnant}
            </div>
            <p className={`text-xs ${metrics.inventory.stagnant > 0 ? "text-amber-600" : "text-zinc-500"}`}>
              Peças paradas há +90 dias
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}