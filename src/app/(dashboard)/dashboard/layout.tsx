"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Handshake, 
  Store, 
  DollarSign, 
  BarChart3, 
  Settings, 
  LogOut 
} from "lucide-react";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Estoque", href: "/dashboard/inventory", icon: Package },
  { name: "Lotes", href: "/dashboard/lots", icon: Layers },
  { name: "Consignações", href: "/dashboard/consignments", icon: Handshake },
  { name: "Parceiros", href: "/dashboard/stores", icon: Store },
  { name: "Financeiro", href: "/dashboard/finance", icon: DollarSign },
  { name: "Relatórios", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-zinc-50">
      <aside className="w-64 bg-zinc-950 text-zinc-200 flex flex-col justify-between border-r border-zinc-800">
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="p-2 bg-white rounded-lg text-zinc-950 font-bold text-sm">
              AM
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Araras Moda</span>
          </div>
          
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-zinc-800 text-white" 
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              Operação Ativa
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center font-medium text-sm text-zinc-700">
              U
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}