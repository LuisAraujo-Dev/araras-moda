"use client";

import { useState, useEffect } from "react";
import { Store, Save, Link as LinkIcon, AtSign, Smartphone, Share2 } from "lucide-react";
import { getStorefrontConfigAction, updateStorefrontConfigAction } from "@/app/actions/storefront.actions";

type StoreConfig = {
  slug: string;
  description: string;
  whatsapp: string;
  instagram: string;
};

export default function StorefrontManagementPage() {
  const [config, setConfig] = useState<StoreConfig>({
    slug: "",
    description: "",
    whatsapp: "",
    instagram: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    getStorefrontConfigAction().then((result) => {
      if (isMounted) {
        if (result.success && result.data) {
          setConfig({
            slug: result.data.slug,
            description: result.data.description || "",
            whatsapp: result.data.whatsapp || "",
            instagram: result.data.instagram || "",
          });
        }
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateStorefrontConfigAction({
      slug: config.slug.toLowerCase().replace(/\s+/g, '-'),
      description: config.description,
      whatsapp: config.whatsapp,
      instagram: config.instagram,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Configurações da loja salvas com sucesso!' });
      if (result.data) {
        setConfig(prev => ({ ...prev, slug: result.data.slug }));
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações.' });
    }
    
    setSaving(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500 font-medium animate-pulse flex items-center gap-2">
          <Store className="w-5 h-5 text-[#1E5AA8]" /> Carregando loja...
        </p>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : "https://araras-moda.vercel.app";
  const displayHost = typeof window !== 'undefined' ? window.location.host : "araras-moda.vercel.app";
  const storeUrl = config.slug ? `${baseUrl}/${config.slug}` : "Configure sua loja para gerar o link";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Minha Loja Virtual</h1>
        <p className="text-[#4B4B4B] mt-1">Configure o seu catálogo online e atraia mais clientes.</p>
      </div>

      {config.slug && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-full">
              <LinkIcon className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-900">Seu catálogo está online em:</p>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline flex items-center gap-1 mt-0.5">
                {storeUrl} <Share2 className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          
          {message && (
            <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0A244A] border-b pb-2">Informações Básicas</h3>
            
            <div>
              <label htmlFor="slug" className="flex text-sm font-medium text-zinc-700 mb-1 items-center gap-2">
                Nome do Link (Slug)
              </label>
              <div className="flex w-full">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 text-zinc-500 sm:text-sm">
                  {displayHost}/
                </span>
                <input
                  type="text"
                  id="slug"
                  required
                  value={config.slug}
                  onChange={(e) => setConfig({ ...config, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="flex-1 min-w-0 px-3 py-2 rounded-none rounded-r-md border border-zinc-300 focus:border-[#1E5AA8] focus:ring-[#1E5AA8] sm:text-sm"
                  placeholder="minha-loja"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="flex text-sm font-medium text-zinc-700 mb-1 items-center gap-2">
                Descrição da Bio
              </label>
              <textarea
                id="description"
                rows={3}
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 focus:border-[#1E5AA8] focus:ring-[#1E5AA8] sm:text-sm"
                placeholder="Conte um pouco sobre o seu brechó e o estilo das suas peças..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0A244A] border-b pb-2 pt-4">Contactos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="whatsapp" className="flex text-sm font-medium text-zinc-700 mb-1 items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> WhatsApp (Vendas)
                </label>
                <input
                  type="text"
                  id="whatsapp"
                  value={config.whatsapp}
                  onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 focus:border-[#1E5AA8] focus:ring-[#1E5AA8] sm:text-sm"
                  placeholder="Ex: 5511999999999"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="flex text-sm font-medium text-zinc-700 mb-1 items-center gap-2">
                  <AtSign className="w-4 h-4 text-pink-600" /> Utilizador do Instagram
                </label>
                <div className="flex w-full">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 text-zinc-500 sm:text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    id="instagram"
                    value={config.instagram}
                    onChange={(e) => setConfig({ ...config, instagram: e.target.value.replace('@', '') })}
                    className="flex-1 min-w-0 px-3 py-2 rounded-none rounded-r-md border border-zinc-300 focus:border-[#1E5AA8] focus:ring-[#1E5AA8] sm:text-sm"
                    placeholder="sua.loja"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
          <button
            type="submit"
            disabled={saving || !config.slug}
            className="flex items-center gap-2 bg-[#1E5AA8] text-white px-5 py-2 rounded-md font-medium hover:bg-[#103A73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? (
              <span className="animate-pulse">A Salvar...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}