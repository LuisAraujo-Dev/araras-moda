// src/app/(dashboard)/dashboard/storefront/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Store, Save, Link as LinkIcon, AtSign, Smartphone, Share2, Globe, EyeOff, Package, ImageIcon, Loader2, Camera, Pencil, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStorefrontConfigAction, updateStorefrontConfigAction, togglePieceVisibilityAction, updateStorefrontPieceAction } from "@/app/actions/storefront.actions";
import { getPiecesAction } from "@/app/actions/piece.actions";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";
import { Badge } from "@/components/ui/badge";
import { Piece, PieceImage } from "@prisma/client";

type StoreConfig = {
  slug: string;
  description: string;
  whatsapp: string;
  instagram: string;
  logoUrl: string | null;
};

type PieceBasic = {
  id: string;
  code: string;
  name: string;
  purchasePrice: number;
  estimatedSalePrice: number;
  promoPrice: number | null;
  observations: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  status: string;
  imageUrl: string | null;
};

type PieceWithImages = Piece & { images?: PieceImage[] };

export default function StorefrontManagementPage() {
  const [config, setConfig] = useState<StoreConfig>({
    slug: "", description: "", whatsapp: "", instagram: "", logoUrl: null,
  });
  
  const [pieces, setPieces] = useState<PieceBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingPiece, setEditingPiece] = useState<PieceBasic | null>(null);
  const [pieceFile, setPieceFile] = useState<File | null>(null);
  const [piecePreview, setPiecePreview] = useState<string | null>(null);
  const [isUploadingPiece, setIsUploadingPiece] = useState(false);
  const pieceFileInputRef = useRef<HTMLInputElement>(null);

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
        logoUrl: storeResult.data.logoUrl || null,
      });
      setLogoPreview(storeResult.data.logoUrl || null);
    }

    const formattedPieces = (piecesResult as PieceWithImages[]).map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      purchasePrice: p.purchasePrice,
      estimatedSalePrice: p.estimatedSalePrice || 0,
      promoPrice: p.promoPrice || null,
      observations: p.observations || "",
      isPublished: p.isPublished,
      isFeatured: p.isFeatured || false,
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    let finalLogoUrl = config.logoUrl;

    if (logoFile) {
      try {
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(logoFile.name)}`, { method: "POST", body: logoFile });
        if (res.ok) {
          const blob = await res.json();
          finalLogoUrl = blob.url;
        }
      } catch {
        setMessage({ type: 'error', text: 'Falha ao enviar o logotipo.' });
        setSaving(false);
        return;
      }
    }

    // Criar o slug a partir do nome da loja digitado
    const formattedSlug = config.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const result = await updateStorefrontConfigAction({
      slug: formattedSlug,
      description: config.description,
      whatsapp: config.whatsapp,
      instagram: config.instagram,
      logoUrl: finalLogoUrl || undefined,
    });

    if (result.success && result.data) {
      setMessage({ type: 'success', text: 'Configurações da loja salvas com sucesso!' });
      setConfig({
        slug: result.data.slug,
        description: result.data.description || "",
        whatsapp: result.data.whatsapp || "",
        instagram: result.data.instagram || "",
        logoUrl: result.data.logoUrl || null,
      });
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

  const handlePieceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPieceFile(file);
      setPiecePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitPieceEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPiece) return;
    setIsUploadingPiece(true);

    const formData = new FormData(e.currentTarget);
    let finalImageUrl = piecePreview;

    if (pieceFile) {
      try {
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(pieceFile.name)}`, { method: "POST", body: pieceFile });
        if (res.ok) {
          const blob = await res.json();
          finalImageUrl = blob.url;
        }
      } catch {
        setMessage({ type: 'error', text: 'Erro ao enviar foto da peça.' });
        setIsUploadingPiece(false);
        return;
      }
    }

    const promoPriceRaw = formData.get("promoPrice");
    
    const data = {
      estimatedSalePrice: Number(formData.get("estimatedSalePrice")),
      promoPrice: promoPriceRaw ? Number(promoPriceRaw) : null,
      observations: formData.get("observations") as string,
      isFeatured: formData.get("isFeatured") === "on",
      imageUrl: finalImageUrl && !finalImageUrl.startsWith('blob:') ? finalImageUrl : undefined
    };

    const result = await updateStorefrontPieceAction(editingPiece.id, data);
    
    if (result.success) {
      setPieces(prev => prev.map(p => p.id === editingPiece.id ? { 
        ...p, 
        estimatedSalePrice: data.estimatedSalePrice, 
        promoPrice: data.promoPrice,
        observations: data.observations, 
        isFeatured: data.isFeatured,
        imageUrl: finalImageUrl 
      } : p));
      setMessage({ type: 'success', text: 'Peça atualizada com sucesso!' });
      setEditingPiece(null);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar peça.' });
    }
    
    setIsUploadingPiece(false);
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

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : "https://araras-moda.vercel.app";
  const storeUrl = config.slug ? `${baseUrl}/${config.slug}` : "Configure sua loja para gerar o link";

  const availablePieces = pieces.filter(p => p.status !== 'VENDIDA');

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Minha Loja Virtual</h1>
        <p className="text-[#4B4B4B] mt-1">Personalize o visual e faça a curadoria das peças da sua vitrine pública.</p>
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
        
        <form onSubmit={handleSubmitConfig} className="lg:col-span-1 bg-white rounded-xl border border-zinc-200 shadow-sm h-fit">
          <div className="p-5 space-y-6">
            
            <div className="flex flex-col items-center justify-center border-b border-zinc-100 pb-6">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoChange} />
              <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center cursor-pointer relative overflow-hidden group hover:border-[#1E5AA8] transition-colors shadow-sm">
                {logoPreview ? (
                  <>
                    <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-zinc-400 group-hover:text-[#1E5AA8]">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Logotipo</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1">Nome da Loja</label>
                <input type="text" required value={config.slug} onChange={(e) => setConfig({ ...config, slug: e.target.value })} className="w-full px-3 py-2 rounded-md border border-zinc-300 focus:border-[#1E5AA8] outline-none sm:text-sm" placeholder="O nome da sua loja" />
              </div>
              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1">Slogan</label>
                <textarea rows={3} value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} className="w-full px-3 py-2 rounded-md border border-zinc-300 focus:border-[#1E5AA8] outline-none sm:text-sm" placeholder="Elegância e curadoria exclusiva..." />
              </div>
              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1 items-center gap-1"><Smartphone className="w-4 h-4 text-emerald-600" /> WhatsApp</label>
                <input type="text" value={config.whatsapp} onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })} className="w-full px-3 py-2 rounded-md border border-zinc-300 focus:border-[#1E5AA8] outline-none sm:text-sm" placeholder="Ex: 5511999999999" />
              </div>
              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1 items-center gap-1"><AtSign className="w-4 h-4 text-pink-600" /> Instagram</label>
                <div className="flex w-full">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 text-zinc-500 sm:text-sm">@</span>
                  <input type="text" value={config.instagram} onChange={(e) => setConfig({ ...config, instagram: e.target.value.replace('@', '') })} className="flex-1 min-w-0 px-3 py-2 rounded-none rounded-r-md border border-zinc-300 focus:border-[#1E5AA8] outline-none sm:text-sm" placeholder="sua.loja" />
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-200">
            <button type="submit" disabled={saving || !config.slug} className="w-full flex justify-center items-center gap-2 bg-[#0A244A] text-white px-4 py-2.5 rounded-md font-medium hover:bg-[#1E5AA8] transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar Loja</>}
            </button>
          </div>
        </form>

        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-800px">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-[#0A244A] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#1E5AA8]" /> Curadoria da Vitrine
            </h3>
            <Badge variant="outline" className="bg-white">{availablePieces.filter(p => p.isPublished).length} publicadas</Badge>
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
                  <div key={piece.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${piece.isPublished ? 'bg-emerald-50/30 border-emerald-200 shadow-sm' : 'bg-white border-zinc-200'}`}>
                    
                    <div className="w-16 h-20 rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                      {piece.imageUrl ? (
                        <Image src={piece.imageUrl} alt={piece.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-zinc-300" />
                      )}
                      {piece.isFeatured && (
                        <div className="absolute top-0 left-0 w-full bg-[#1E5AA8] text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-wider">
                          Destaque
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-bold text-[#0A244A] truncate">{piece.name}</p>
                      <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">Ref: {piece.code}</p>
                      
                      {piece.promoPrice && piece.promoPrice > 0 ? (
                        <p className="text-xs font-bold text-rose-600 mt-1">
                          <span className="line-through text-zinc-400 font-normal mr-1">{formatCurrency(piece.estimatedSalePrice)}</span>
                          {formatCurrency(piece.promoPrice)}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-emerald-700 mt-1">{piece.estimatedSalePrice > 0 ? formatCurrency(piece.estimatedSalePrice) : 'Preço não definido'}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={() => { setEditingPiece(piece); setPiecePreview(piece.imageUrl); setPieceFile(null); }} className="p-2 rounded-md transition-all cursor-pointer border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100" title="Editar Peça na Loja">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleVisibility(piece.id, piece.isPublished)} className={`p-2 rounded-md transition-all cursor-pointer border ${piece.isPublished ? "border-emerald-300 text-emerald-700 bg-emerald-100 hover:bg-emerald-200" : "border-zinc-200 text-zinc-400 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-700"}`} title={piece.isPublished ? "Remover da Vitrine" : "Publicar na Vitrine"}>
                        {piece.isPublished ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <Dialog open={!!editingPiece} onOpenChange={(val) => !val && setEditingPiece(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[#0A244A] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1E5AA8]" /> Editar Peça na Loja
            </DialogTitle>
          </DialogHeader>
          {editingPiece && (
            <form onSubmit={handleSubmitPieceEdit} className="space-y-5 pt-4">
              
              <div className="flex justify-center">
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={pieceFileInputRef} onChange={handlePieceImageChange} />
                <div onClick={() => pieceFileInputRef.current?.click()} className="w-32 h-40 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center cursor-pointer relative overflow-hidden group hover:border-[#1E5AA8] transition-colors">
                  {piecePreview ? (
                    <>
                      <Image src={piecePreview} alt="Peça" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-400 group-hover:text-[#1E5AA8]">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-xs font-medium">Mudar Foto</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex text-sm font-medium text-zinc-700 mb-1">Preço Normal (R$)</label>
                  <input type="number" step="0.01" min="0" name="estimatedSalePrice" defaultValue={editingPiece.estimatedSalePrice || ""} className="w-full h-10 px-3 rounded-md border border-zinc-300 focus:border-[#1E5AA8] outline-none text-sm" placeholder="Ex: 0 p/ Consultar" />
                </div>
                <div>
                  <label className="flex text-sm font-medium text-rose-700 mb-1">Preço Promo (R$)</label>
                  <input type="number" step="0.01" min="0" name="promoPrice" defaultValue={editingPiece.promoPrice || ""} className="w-full h-10 px-3 rounded-md border border-rose-300 focus:border-rose-500 outline-none text-sm bg-rose-50" placeholder="Opcional" />
                </div>
              </div>

              <div>
                <label className="flex text-sm font-medium text-zinc-700 mb-1">Descrição Visível ao Cliente</label>
                <textarea name="observations" rows={2} defaultValue={editingPiece.observations || ""} className="w-full px-3 py-2 rounded-md border border-zinc-300 focus:border-[#1E5AA8] outline-none text-sm" placeholder="Tamanho M, veste super bem, perfeito estado..." />
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <input type="checkbox" id="isFeatured" name="isFeatured" defaultChecked={editingPiece.isFeatured} className="w-4 h-4 text-[#1E5AA8] rounded border-zinc-300 focus:ring-[#1E5AA8] cursor-pointer" />
                <label htmlFor="isFeatured" className="text-sm font-semibold text-[#0A244A] cursor-pointer">
                  Destacar na página inicial da Loja
                </label>
              </div>

              <button type="submit" disabled={isUploadingPiece} className="w-full h-11 bg-[#1E5AA8] text-white rounded-md font-medium hover:bg-[#103A73] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {isUploadingPiece ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Curadoria"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}