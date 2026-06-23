"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Building2, User, Shield, Save } from "lucide-react";
import { getSettingsDataAction, updateCompanyAction, updateUserProfileAction } from "@/app/actions/settings.actions";

// 1. Definimos exatamente qual é o formato dos dados para agradar ao TypeScript (e remover o erro de "any")
type CompanyData = {
  id: string;
  name: string;
};

type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

export default function SettingsPage() {
  const mockCompanyId = "company-placeholder-id";

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const loadData = async () => {
    const result = await getSettingsDataAction(mockCompanyId);
    if (result.success) {
      setCompany(result.company as CompanyData);
      setUser(result.user as UserData);
    }
  };

  // 2. Corrigimos o useEffect para não causar renders em cascata
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialData = async () => {
      const result = await getSettingsDataAction(mockCompanyId);
      if (isMounted) {
        if (result.success) {
          setCompany(result.company as CompanyData);
          setUser(result.user as UserData);
        }
        setPageLoading(false);
      }
    };
    
    fetchInitialData();
    
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleUpdateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!company) return;
    
    setLoadingCompany(true);
    const formData = new FormData(e.currentTarget);
    const newName = formData.get("companyName") as string;
    
    const result = await updateCompanyAction(mockCompanyId, newName);
    setLoadingCompany(false);

    if (result.success) {
      showBanner("Dados da empresa atualizados com sucesso!", "success");
      await loadData();
    } else {
      showBanner(result.error || "Erro ao atualizar empresa.", "error");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setLoadingUser(true);
    const formData = new FormData(e.currentTarget);
    const newName = formData.get("userName") as string;
    
    const result = await updateUserProfileAction(user.id, newName);
    setLoadingUser(false);

    if (result.success) {
      showBanner("Perfil atualizado com sucesso!", "success");
      await loadData();
    } else {
      showBanner(result.error || "Erro ao atualizar perfil.", "error");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500 font-medium animate-pulse">A carregar configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative max-w-4xl">
      {banner.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl transition-all min-w-80 ${banner.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Configurações</h1>
          <p className="text-[#4B4B4B] mt-1">Faça a gestão da sua conta e das preferências do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Cartão de Perfil */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-3">
            <User className="w-5 h-5 text-[#1E5AA8]" />
            <h3 className="font-semibold text-[#0A244A]">Meu Perfil</h3>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="userName" className="text-[#0A244A]">Nome Completo</Label>
                <Input 
                  id="userName" 
                  name="userName" 
                  defaultValue={user?.name || ""} 
                  placeholder="O seu nome..." 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#0A244A]">E-mail de Acesso</Label>
                <Input 
                  value={user?.email || "Email não registado"} 
                  disabled 
                  className="bg-zinc-100 text-zinc-500" 
                />
                <p className="text-xs text-zinc-400 mt-1">O e-mail de acesso não pode ser alterado por aqui.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#0A244A]">Nível de Permissão</Label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-zinc-200 bg-zinc-50">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-zinc-700">{user?.role || "ADMINISTRADOR"}</span>
                </div>
              </div>

              <Button type="submit" disabled={loadingUser} className="w-full bg-[#1E5AA8] hover:bg-[#103A73] text-white cursor-pointer mt-2">
                {loadingUser ? "A guardar..." : (
                  <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Guardar Perfil</span>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Cartão da Empresa */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-[#1E5AA8]" />
            <h3 className="font-semibold text-[#0A244A]">Dados da Empresa</h3>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleUpdateCompany} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-[#0A244A]">Nome da Loja / Operação</Label>
                <Input 
                  id="companyName" 
                  name="companyName" 
                  defaultValue={company?.name || ""} 
                  placeholder="Ex: Araras Moda" 
                  required 
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mt-6">
                <h4 className="text-sm font-bold text-blue-900 mb-1">Informação do Sistema</h4>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  As faturas, relatórios e recibos gerados pela plataforma utilizarão este nome como cabeçalho principal. Garanta que o nome está escrito corretamente.
                </p>
              </div>

              <Button type="submit" disabled={loadingCompany} className="w-full bg-[#1E5AA8] hover:bg-[#103A73] text-white cursor-pointer mt-6">
                {loadingCompany ? "A guardar..." : (
                  <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Guardar Empresa</span>
                )}
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}