import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Handshake, TrendingUp, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const metrics = {
    inventory: { inStock: 142, consigned: 58, stagnant: 12 },
    finance: { totalRevenue: 4850.00, totalExpense: 1200.00, netProfit: 3650.00 }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Visão Geral</h1>
        <p className="text-zinc-500">Acompanhe os indicadores em tempo real da sua operação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-950">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.finance.netProfit)}
            </div>
            <p className="text-xs text-zinc-500">Receita menos despesas brutas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-950">{metrics.inventory.stagnant}</div>
            <p className="text-xs text-zinc-500">Peças paradas há +90 dias</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}