"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Handshake, 
  Store, 
  ShoppingBag,
  DollarSign, 
  BarChart3, 
  Settings,
  Calendar,
  Boxes,
  Loader2,
  Menu,
  X
} from "lucide-react";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Estoque", href: "/dashboard/inventory", icon: Package },
  { name: "Aquisições / Lotes", href: "/dashboard/lots", icon: Boxes },
  { name: "Consignações", href: "/dashboard/consignments", icon: Handshake },
  { name: "Parceiros", href: "/dashboard/stores", icon: Store },
  { name: "Minha Loja", href: "/dashboard/storefront", icon: ShoppingBag },
  { name: "Calendário", href: "/dashboard/calendar", icon: Calendar },
  { name: "Financeiro", href: "/dashboard/finance", icon: DollarSign },
  { name: "Relatórios", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState("Gestor");
  const [userInitials, setUserInitials] = useState("AM");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    checkOnboardingStatusAction().then((res) => {
      if (!isMounted) return;

      if (res.success) {
        if (res.needsSetup && pathname !== "/dashboard/setup") {
          router.replace("/dashboard/setup");
        } else {
          if (res.userName) {
            const names = res.userName.split(" ");
            setUserName(names[0]);
            setUserInitials(names[0].charAt(0).toUpperCase());
          }
          setIsAuthorized(true);
        }
      } else {
        setIsAuthorized(true);
      }
    });

    return () => { isMounted = false; };
  }, [pathname, router]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  if (!isAuthorized && pathname !== "/dashboard/setup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E5AA8]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-40 flex items-center justify-between px-4 shadow-sm">
        <span className="text-xl font-bold text-[#0A244A] tracking-tight">Araras Moda</span>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-xs bg-white h-full flex flex-col shadow-xl animate-in slide-in-from-left-full duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 shrink-0">
              <span className="text-xl font-bold text-[#0A244A] tracking-tight">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#1E5AA8]/10 text-[#1E5AA8]" 
                        : "text-[#4B4B4B] hover:bg-zinc-100 hover:text-[#0A244A]" 
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-[#1E5AA8]" : "text-zinc-500"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-200 shrink-0">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#1E5AA8] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {userInitials}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-[#0A244A] truncate">{userName}</span>
                  <span className="text-[10px] text-zinc-500 truncate">Sua Conta</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <aside className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col sticky top-0 h-screen shrink-0">
        
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <span className="text-xl font-bold text-[#0A244A] tracking-tight">Araras Moda</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#1E5AA8]/10 text-[#1E5AA8]" 
                    : "text-[#4B4B4B] hover:bg-zinc-100 hover:text-[#0A244A]" 
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#1E5AA8]" : "text-zinc-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#1E5AA8] flex items-center justify-center text-white font-bold text-xs shrink-0">
              {userInitials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-[#0A244A] truncate">{userName}</span>
              <span className="text-[10px] text-zinc-500 truncate">Sua Conta</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}