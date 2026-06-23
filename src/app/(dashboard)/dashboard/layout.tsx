//src/app/(dashboard)/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Handshake, 
  Store, 
  DollarSign, 
  BarChart3, 
  Settings,
  Calendar,
  Boxes
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Estoque", href: "/dashboard/inventory", icon: Package },
  { name: "Aquisições / Lotes", href: "/dashboard/lots", icon: Boxes },
  { name: "Consignações", href: "/dashboard/consignments", icon: Handshake },
  { name: "Parceiros", href: "/dashboard/stores", icon: Store },
  { name: "Calendário", href: "/dashboard/calendar", icon: Calendar },
  { name: "Financeiro", href: "/dashboard/finance", icon: DollarSign },
  { name: "Relatórios", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      
      {/* Menu Lateral (Sidebar) */}
      <aside className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col sticky top-0 h-screen shrink-0">
        
        {/* Logotipo / Cabeçalho do Menu */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <span className="text-xl font-bold text-[#0A244A] tracking-tight">Araras Moda</span>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navigationItems.map((item) => {
            // Verifica se a rota atual é exatamente o href ou se é uma sub-página
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#1E5AA8]/10 text-[#1E5AA8]" // Cor ativa
                    : "text-[#4B4B4B] hover:bg-zinc-100 hover:text-[#0A244A]" // Cor inativa
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#1E5AA8]" : "text-zinc-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé do Menu (Perfil do Utilizador) */}
        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#1E5AA8] flex items-center justify-center text-white font-bold text-xs shrink-0">
              AM
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-[#0A244A] truncate">Gestor</span>
              <span className="text-[10px] text-zinc-500 truncate">Araras Moda</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal onde as páginas (children) são renderizadas */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}