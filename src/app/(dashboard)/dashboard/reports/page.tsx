"use client";

import { useState, useEffect } from "react";
import { Package, TrendingUp, TrendingDown, Wallet, Handshake, CheckCircle2, AlertCircle, BarChart3, PieChart, ShoppingBag } from "lucide-react";
import { getReportsAction } from "@/app/actions/report.actions";

type ReportData = {
  financials: {
    revenue: number;
    expense: number;
    balance: number;
    expensesByCategory: { name: string; value: number }[];
    revenuesByType: { name: string; value: number }[];
  };
  inventory: {
    total: number;
    inStock: number;
    consigned: number;
    sold: number;
    other: number;
    activeInventoryCost: number;
  };
};

export default function ReportsPage() {
  const mockCompanyId = "company-placeholder-id";

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReports = async () => {
      setLoading(true);
      const result = await getReportsAction(mockCompanyId);
      if (isMounted && result.success && result.data) {
        setReportData(result.data);
      }
      if (isMounted) setLoading(false);
    };
    fetchReports();
    return () => { isMounted = false; };
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <BarChart3 className="w-12 h-12 text-[#1E5AA8] animate-pulse" />
        <p className="text-[#0A244A] font-medium">A processar inteligência de negócio...</p>
      </div>
    );
  }

  const { financials, inventory } = reportData;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Relatórios & Analytics</h1>
          <p className="text-[#4B4B4B] mt-1">Visão geral do desempenho do acervo e da saúde financeira da empresa.</p>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Peças Ativas</h3>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0A244A]">{inventory.inStock + inventory.consigned}</p>
            <p className="text-sm text-zinc-500 mt-1">Prontas ou em loja</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Peças Vendidas</h3>
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-lime-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0A244A]">{inventory.sold}</p>
            <p className="text-sm text-zinc-500 mt-1">Histórico de saídas</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Custo do Estoque</h3>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0A244A]">{formatCurrency(inventory.activeInventoryCost)}</p>
            <p className="text-sm text-zinc-500 mt-1">Dinheiro empatado</p>
          </div>
        </div>

        <div className={`rounded-xl border p-6 shadow-sm flex flex-col justify-between ${financials.balance >= 0 ? 'bg-[#1E5AA8] border-[#103A73]' : 'bg-rose-600 border-rose-800'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Lucro Real</h3>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{formatCurrency(financials.balance)}</p>
            <p className="text-sm text-white/80 mt-1">Entradas - Saídas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Painel do Acervo */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-3">
            <PieChart className="w-5 h-5 text-[#1E5AA8]" />
            <h3 className="font-semibold text-[#0A244A]">Distribuição do Acervo ({inventory.total} peças)</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-6">
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Na Arara (Em Estoque)
                </span>
                <span className="text-sm font-bold text-[#0A244A]">{inventory.inStock} ({calculatePercentage(inventory.inStock, inventory.total)}%)</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calculatePercentage(inventory.inStock, inventory.total)}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-purple-700 flex items-center gap-2">
                  <Handshake className="w-4 h-4" /> Consignadas (Em Parceiros)
                </span>
                <span className="text-sm font-bold text-[#0A244A]">{inventory.consigned} ({calculatePercentage(inventory.consigned, inventory.total)}%)</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${calculatePercentage(inventory.consigned, inventory.total)}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-lime-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Vendidas
                </span>
                <span className="text-sm font-bold text-[#0A244A]">{inventory.sold} ({calculatePercentage(inventory.sold, inventory.total)}%)</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-lime-500 rounded-full" style={{ width: `${calculatePercentage(inventory.sold, inventory.total)}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-zinc-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Outras (Doação, Conserto...)
                </span>
                <span className="text-sm font-bold text-[#0A244A]">{inventory.other} ({calculatePercentage(inventory.other, inventory.total)}%)</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${calculatePercentage(inventory.other, inventory.total)}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* Painel Financeiro */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-[#1E5AA8]" />
            <h3 className="font-semibold text-[#0A244A]">Análise de Despesas</h3>
          </div>
          <div className="p-6 flex-1 overflow-y-auto max-h-100">
            {financials.expensesByCategory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <TrendingDown className="w-10 h-10 text-zinc-200 mb-3" />
                <p className="text-sm text-zinc-500">Nenhuma despesa registada ainda.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {financials.expensesByCategory.map((exp) => (
                  <div key={exp.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-zinc-700">{exp.name}</span>
                      <span className="text-sm font-bold text-rose-600">
                        {formatCurrency(exp.value)} 
                        <span className="text-xs text-zinc-400 ml-2 font-normal">
                          ({calculatePercentage(exp.value, financials.expense)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${calculatePercentage(exp.value, financials.expense)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}