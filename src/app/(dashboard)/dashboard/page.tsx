"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Package, 
  Wallet, 
  Handshake, 
  Bell, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  MapPin,
  CheckCircle2,
  Circle,
  Boxes
} from "lucide-react";
import { getDashboardDataAction, toggleEventCompletionAction } from "@/app/actions/dashboard.actions";

type DashboardData = {
  userName: string;
  kpis: {
    activePieces: number;
    activeConsignments: number;
    balance: number;
  };
  todayEvents: Array<{
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startDate: Date;
    isAllDay: boolean;
    type: string;
    isCompleted: boolean;
  }>;
  expiringConsignments: Array<{
    id: string;
    store: { name: string };
    startDate: Date;
    expectedReturnDate: Date | null;
    _count: { items: number };
  }>;
};

export default function DashboardHomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboard = async () => {
      const result = await getDashboardDataAction();
      if (isMounted) {
        if (result.success && result.data) {
          setData(result.data as DashboardData);
        }
        setLoading(false);
      }
    };
    
    fetchDashboard();
    
    return () => { isMounted = false; };
  }, []);

  const handleToggleEvent = async (eventId: string, currentStatus: boolean) => {
    if (data) {
      const updatedEvents = data.todayEvents.map(ev => 
        ev.id === eventId ? { ...ev, isCompleted: !currentStatus } : ev
      );
      setData({ ...data, todayEvents: updatedEvents });
    }
    
    await toggleEventCompletionAction(eventId, !currentStatus);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const isOverdue = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500 font-medium animate-pulse flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#1E5AA8]" /> A preparar o seu painel de controlo...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Cabeçalho Personalizado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Olá, {data.userName} 👋</h1>
          <p className="text-[#4B4B4B] mt-1">Este é o resumo da sua operação na Araras Moda hoje.</p>
        </div>
        <Link href="/dashboard/calendar" className="flex items-center gap-2 bg-white border border-zinc-200 text-[#0A244A] px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
          <CalendarIcon className="w-4 h-4 text-[#1E5AA8]" /> Ver Calendário Completo
        </Link>
      </div>

      {/* Cartões Rápidos (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/inventory" className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Peças Ativas</h3>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0A244A]">{data.kpis.activePieces}</p>
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">Em estoque ou lojas <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
          </div>
        </Link>

        <Link href="/dashboard/consignments" className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-purple-600 transition-colors">Remessas Abertas</h3>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0A244A]">{data.kpis.activeConsignments}</p>
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">A aguardar acerto <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
          </div>
        </Link>

        <Link href="/dashboard/finance" className={`rounded-xl border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group ${data.kpis.balance >= 0 ? 'bg-[#1E5AA8] border-[#103A73] hover:bg-[#103A73]' : 'bg-rose-600 border-rose-800 hover:bg-rose-700'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider group-hover:text-white transition-colors">Saldo Geral</h3>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{formatCurrency(data.kpis.balance)}</p>
            <p className="text-sm text-white/80 mt-1 flex items-center gap-1">Lucro Real <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Painel Esquerdo: Agenda de Hoje Interativa */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-100">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <CalendarIcon className="w-5 h-5 text-[#1E5AA8]" />
                {data.todayEvents.filter(e => !e.isCompleted).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-[#0A244A]">Agenda para Hoje</h3>
            </div>
            <span className="text-xs font-bold bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
              {data.todayEvents.filter(e => e.isCompleted).length} / {data.todayEvents.length} Concluídos
            </span>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {data.todayEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm text-zinc-500">O dia está livre!</p>
                <p className="text-xs text-zinc-400 mt-1">Nenhum compromisso marcado para hoje.</p>
              </div>
            ) : (
              data.todayEvents.map(event => (
                <div key={event.id} className={`border rounded-lg p-3 transition-all ${event.isCompleted ? 'bg-zinc-50 border-zinc-200 opacity-60' : 'bg-white hover:bg-zinc-50/80 border-zinc-200 shadow-sm'}`}>
                  
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => handleToggleEvent(event.id, event.isCompleted)}
                      className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${event.isCompleted ? 'text-emerald-500 hover:text-emerald-600' : 'text-zinc-300 hover:text-[#1E5AA8]'}`}
                    >
                      {event.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-bold text-sm leading-tight ${event.isCompleted ? 'text-zinc-500 line-through' : 'text-[#0A244A]'}`}>
                          {event.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                          {event.type}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-1.5 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {event.isAllDay ? "Dia Todo" : new Date(event.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {event.location && event.location !== "Não definido" && (
                          <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {event.location}
                          </span>
                        )}
                      </div>

                      {/* Botões de Ação Contextual (Apenas visíveis se o evento não estiver concluído) */}
                      {!event.isCompleted && (
                        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-2">
                          {(event.type === "Bazar" || event.type === "Ida ao Parceiro") && (
                            <Link href="/dashboard/consignments" className="flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-md transition-colors border border-purple-200">
                              <Handshake className="w-3.5 h-3.5" /> Lançar Remessa
                            </Link>
                          )}
                          {(event.type === "Lavagem de Lote") && (
                            <Link href="/dashboard/lots" className="flex items-center gap-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1.5 rounded-md transition-colors border border-cyan-200">
                              <Boxes className="w-3.5 h-3.5" /> Ver Aquisições
                            </Link>
                          )}
                          {(event.type === "Postar Peças" || event.type === "Manutenção das Peças") && (
                            <Link href="/dashboard/inventory" className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors border border-blue-200">
                              <Package className="w-3.5 h-3.5" /> Atualizar Estoque
                            </Link>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Painel Direito: Alertas de Consignação */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-100">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${data.expiringConsignments.length > 0 ? "text-amber-500" : "text-zinc-400"}`} />
            <h3 className="font-semibold text-[#0A244A]">Atenção: Consignações</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {data.expiringConsignments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Handshake className="w-10 h-10 text-zinc-200 mb-3" />
                <p className="text-sm text-zinc-500">Tudo em dia com os parceiros!</p>
                <p className="text-xs text-zinc-400 mt-1">Nenhuma remessa a expirar nos próximos 7 dias.</p>
              </div>
            ) : (
              data.expiringConsignments.map(cons => {
                const overdue = isOverdue(cons.expectedReturnDate);
                return (
                  <Link href="/dashboard/consignments" key={cons.id} className={`border rounded-lg p-3 block transition-colors ${overdue ? "bg-rose-50 border-rose-200 hover:bg-rose-100" : "bg-amber-50 border-amber-200 hover:bg-amber-100"}`}>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`font-bold text-sm leading-tight ${overdue ? "text-rose-900" : "text-amber-900"}`}>
                        {cons.store.name}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${overdue ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800"}`}>
                        {overdue ? "Em Atraso" : "A Expirar"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs font-medium ${overdue ? "text-rose-700" : "text-amber-700"}`}>
                        Retorno: {cons.expectedReturnDate ? new Date(cons.expectedReturnDate).toLocaleDateString('pt-BR') : "Não definido"}
                      </p>
                      <span className="text-xs font-bold text-zinc-600 bg-white px-2 py-0.5 rounded-full shadow-sm">
                        {cons._count.items} peças
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}