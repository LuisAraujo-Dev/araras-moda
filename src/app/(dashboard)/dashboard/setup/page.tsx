"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { completeSetupAction, checkOnboardingStatusAction } from "@/app/actions/setup.actions"; 

export default function SetupOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("Gestor");
  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "BRECHO",
  });

  // Logo que a página carrega, procuramos o nome do utilizador para personalizar
  useEffect(() => {
    checkOnboardingStatusAction().then((res) => {
      if (res.success && res.userName) {
        setUserName(res.userName.split(" ")[0]); // Pega só o primeiro nome
      }
      setPageLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await completeSetupAction(formData);
    
    if (result.success) {
      setStep(2);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh(); // Força a atualização do menu lateral com o nome da empresa
      }, 2000);
    } else {
      alert("Erro: " + result.error);
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="fixed inset-0 bg-zinc-50 z-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1E5AA8]" /></div>;
  }

  return (
    <div className="fixed inset-0 bg-zinc-50 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1E5AA8] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-[#0A244A] tracking-tight">
            Olá, {userName}! 👋
          </h1>
          <p className="text-zinc-500 mt-2">
            Vamos configurar o seu espaço de trabalho na Araras Moda.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              
              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-semibold text-[#0A244A]">
                  Qual é o nome da sua Loja?
                </label>
                <input
                  type="text"
                  id="companyName"
                  required
                  autoFocus
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-zinc-300 focus:border-[#1E5AA8] focus:ring-[#1E5AA8] transition-colors"
                  placeholder="Ex: Brechó da Maria"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="businessType" className="block text-sm font-semibold text-[#0A244A]">
                  Tipo de Negócio
                </label>
                <select
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-zinc-300 focus:border-[#1E5AA8] focus:ring-[#1E5AA8] bg-white transition-colors"
                >
                  <option value="BRECHO">Brechó / Moda Circular</option>
                  <option value="BOUTIQUE">Boutique / Loja de Roupas</option>
                  <option value="OUTLET">Outlet</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.companyName}
                className="w-full h-12 flex items-center justify-center gap-2 bg-[#1E5AA8] text-white rounded-lg font-medium hover:bg-[#103A73] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-pulse">A preparar tudo...</span>
                ) : (
                  <>
                    Começar a usar <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#0A244A]">Tudo Pronto!</h2>
              <p className="text-zinc-500 text-sm">A redirecionar para o seu painel...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}