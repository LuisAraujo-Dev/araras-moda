"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Store, Save, Link as LinkIcon, AtSign, Smartphone, Share2, Globe, EyeOff, Package, ImageIcon, Loader2 } from "lucide-react";
import { getStorefrontConfigAction, updateStorefrontConfigAction, togglePieceVisibilityAction } from "@/app/actions/storefront.actions";
import { getPiecesAction } from "@/app/actions/piece.actions";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";
import { Badge } from "@/components/ui/badge";
import { Piece, PieceImage } from "@prisma/client";

type StoreConfig = {
  slug: string;
  description: string;
  whatsapp: string;
  instagram: string;
};

type PieceBasic = {
  id: string;
  code: string;
  name: string;
  purchasePrice: number;
  isPublished: boolean;
  status: string;
  imageUrl: string | null;
};

type PieceWithImages = Piece & { images?: PieceImage[] };

export default function StorefrontManagementPage() {
  const [config, setConfig] = useState<StoreConfig>({
    slug: "",
    description: "",
    whatsapp: "",
    instagram: "",
  });
  
  const [pieces, setPieces] = useState<PieceBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const loadData = async (cid: string) => {
    const [storeResult, piecesResult] = await Promise.all([
      getStorefrontConfigAction(),
      getPiecesAction(cid)
    ]);
    
    if (storeResult.success && storeResult.data) {
      setConfig({
        slug: storeResult.data.slug,
        description: storeResult.data.description || "",
        whatsapp: storeResult.data.whatsapp || "",
        instagram: storeResult.data.instagram || "",
      });
    }

    const formattedPieces = (piecesResult as PieceWithImages[]).map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      purchasePrice: p.purchasePrice,
      isPublished: p.isPublished,
      status: p.status,
      imageUrl: p.images && p.images.length > 0 ? p.images[0].imageUrl : null
    }));
    
    setPieces(formattedPieces);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const status = await checkOnboardingStatusAction();
      if (status.success && status.companyId && isMounted) {
        await loadData(status.companyId);
      }
    };
    init();
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

  const handleToggleVisibility = async (pieceId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    setPieces(prev => prev.map(p => p.id === pieceId ? { ...p, isPublished: newStatus } : p));

    const result = await togglePieceVisibilityAction(pieceId, newStatus);
    
    if (!result.success) {
      setPieces(prev => prev.map(p => p.id === pieceId ? { ...p, isPublished: currentStatus } : p));
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar a vitrine.' });
      setTimeout(() => setMessage(null), 3000);
    }
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

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : "https://araras-moda.vercel.app";
  const displayHost = typeof window !== 'undefined' ? window.location.host : "araras-moda.vercel.app";
  const storeUrl = config.slug ? `${baseUrl}/${config.slug}` : "Configure sua loja para gerar o link";

  const availablePieces = pieces.filter(p => p.status !== 'VENDIDA');

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Minha Loja Virtual</h1>
        <p className="text-[#4B4B4B] mt-1">Configure o seu catálogo online e gerencie as peças da vitrine.</p>
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

      {message && (
        <div className={`p-4 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white rounded-xl border border-zinc-200 shadow-sm h-fit">
          <div className="p-5 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#0A244A] border-b pb-2">Configurações</h3>
              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1">Nome do Link (Slug)</label>
                <div className="flex w-full">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 text-zinc-500 sm:text-sm">
                    {displayHost}/
                  </span>
                  <input
                    type="text" required value={config.slug}
                    onChange={(e) => setConfig({ ...config, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="flex-1 min-w-0 px-3 py-2 rounded-none rounded-r-md border border-zinc-300 focus:border-[#1E5AA8] outline-none sm:text-sm"
                    placeholder="minha-loja"
                  />
                </div>
              </div>
              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1">Descrição</label>
                <textarea
                  rows={3} value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 focus:border-[#1E5AA8] outline-none sm:text-sm"
                  placeholder="Sobre a sua loja..."
                />
              </div>
              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1 items-center gap-1">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> WhatsApp
                </label>
                <input
                  type="text" value={config.whatsapp} onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 focus:border-[#1E5AA8] outline-none sm:text-sm"
                  placeholder="Ex: 5511999999999"
                />
              </div>
              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1 items-center gap-1">
                  <AtSign className="w-4 h-4 text-pink-600" /> Instagram
                </label>
                <div className="flex w-full">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 text-zinc-500 sm:text-sm">@</span>
                  <input
                    type="text" value={config.instagram} onChange={(e) => setConfig({ ...config, instagram: e.target.value.replace('@', '') })}
                    className="flex-1 min-w-0 px-3 py-2 rounded-none rounded-r-md border border-zinc-300 focus:border-[#1E5AA8] outline-none sm:text-sm"
                    placeholder="sua.loja"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-200">
            <button type="submit" disabled={saving || !config.slug} className="w-full flex justify-center items-center gap-2 bg-[#1E5AA8] text-white px-4 py-2.5 rounded-md font-medium hover:bg-[#103A73] transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar</>}
            </button>
          </div>
        </form>

        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-700px">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-[#0A244A] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#1E5AA8]" /> Vitrine Online
            </h3>
            <Badge variant="outline" className="bg-white">
              {availablePieces.filter(p => p.isPublished).length} publicadas
            </Badge>
          </div>

          <div className="p-2 overflow-y-auto flex-1 custom-scrollbar bg-zinc-50/30">
            {availablePieces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Package className="w-10 h-10 mb-2 opacity-50" />
                <p>Nenhuma peça disponível no estoque.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
                {availablePieces.map(piece => (
                  <div key={piece.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${piece.isPublished ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}>
                    <div className="w-14 h-14 rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                      {piece.imageUrl ? (
                        <Image src={piece.imageUrl} alt={piece.name} fill className="object-cover" sizes="56px" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-zinc-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0A244A] truncate">{piece.name}</p>
                      <p className="text-xs text-zinc-500 font-medium">{piece.code} • {formatCurrency(piece.purchasePrice)}</p>
                    </div>

                    <button 
                      onClick={() => handleToggleVisibility(piece.id, piece.isPublished)} 
                      className={`shrink-0 p-2.5 rounded-md transition-all cursor-pointer border ${piece.isPublished ? "border-emerald-300 text-emerald-700 bg-emerald-100 hover:bg-emerald-200" : "border-zinc-200 text-zinc-400 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-700"}`}
                      title={piece.isPublished ? "Remover da Vitrine" : "Publicar na Vitrine"}
                    >
                      {piece.isPublished ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
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