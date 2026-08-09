// src/app/(dashboard)/dashboard/lots/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, PlusCircle, CheckCircle2, AlertCircle, Pencil, Trash2, MapPin, Loader2, Package, TrendingUp, Camera, Tag, ChevronDown, Search, Check, ArrowLeft, DollarSign } from "lucide-react";
import { getLotsAction, createLotAction, updateLotAction, deleteLotAction } from "@/app/actions/lot.actions";
import { getTaxonomyAction, createPieceAction, quickAddCategory, quickAddBrand, quickAddSize, quickAddColor, quickAddStore } from "@/app/actions/piece.actions";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";
import { Lot, SourceType, Category, Brand, Size, Color, Store as StoreModel } from "@prisma/client";

type EnrichedLot = Lot & {
  registeredPieces: number;
  soldPieces: number;
  expectedRevenue: number;
  averageCost: number;
  expectedProfit: number;
};

type TaxonomyData = {
  categories: Category[]; brands: Brand[]; lots: Lot[]; sizes: Size[]; colors: Color[]; stores: StoreModel[];
};

const TAG_COLORS: Record<string, string> = {
  "Higienização": "bg-cyan-100 text-cyan-900 border-cyan-200",
  "Conserto": "bg-amber-100 text-amber-900 border-amber-400",
  "Em consignação": "bg-purple-100 text-purple-900 border-purple-400",
  "Postada": "bg-blue-100 text-blue-900 border-blue-200",
  "Em estoque": "bg-emerald-100 text-emerald-900 border-emerald-200",
  "Para doação": "bg-teal-100 text-teal-900 border-teal-200",
  "Doada": "bg-zinc-200 text-zinc-900 border-zinc-300",
  "Vendida": "bg-lime-100 text-lime-900 border-lime-500",
  "Descartada": "bg-rose-100 text-rose-900 border-rose-200",
};

const AVAILABLE_TAGS = Object.keys(TAG_COLORS);

type SelectOption = { id: string; name?: string; sourceName?: string; code?: string; };

function SearchableSelect({ value, onChange, options, placeholder, newItemLabel, onAddNew }: { value: string; onChange: (val: string) => void; options: SelectOption[]; placeholder: string; newItemLabel: string; onAddNew: () => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const getText = (opt: SelectOption) => opt.name || (opt.sourceName ? `${opt.sourceName} (${opt.code})` : "");
  const selectedItem = options.find((o) => o.id === value);
  const displayText = selectedItem ? getText(selectedItem) : placeholder;

  const filtered = options.filter((o) => getText(o).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const tA = getText(a).toLowerCase(); const tB = getText(b).toLowerCase(); const s = search.toLowerCase();
      if (tA.startsWith(s) && !tB.startsWith(s)) return -1; if (!tA.startsWith(s) && tB.startsWith(s)) return 1; return 0;
    });

  return (
    <div className="relative">
      <input type="text" value={value} required tabIndex={-1} className="absolute opacity-0 w-0 h-0 pointer-events-none -z-10" onChange={() => {}} />
      <div className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm flex items-center justify-between cursor-pointer focus-within:border-[#1E5AA8] transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <span className={`truncate ${selectedItem ? "text-zinc-900" : "text-zinc-500"}`}>{displayText}</span>
        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-60" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-70 mt-1 w-full bg-white border border-zinc-200 rounded-md shadow-xl max-h-64 flex flex-col overflow-hidden">
            <div className="bg-white p-2 border-b border-zinc-100 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-2 text-zinc-400" />
                <input autoFocus type="text" className="w-full h-8 pl-8 pr-3 text-sm bg-zinc-50 border rounded focus:border-[#1E5AA8] outline-none" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="p-1 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? <div className="px-3 py-4 text-sm text-zinc-500 text-center">Sem resultados</div> : filtered.map((opt) => (
                   <div key={opt.id} className="px-3 py-2 text-sm hover:bg-zinc-100 rounded cursor-pointer flex justify-between" onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(""); }}>
                     <span className="truncate pr-2">{getText(opt)}</span>{value === opt.id && <Check className="w-4 h-4 text-[#1E5AA8] shrink-0" />}
                   </div>
                ))}
              <div className="border-t border-zinc-100 my-1"></div>
              <div className="px-3 py-2.5 text-sm font-bold text-[#1E5AA8] hover:bg-blue-50 rounded cursor-pointer flex items-center gap-2" onClick={() => { onAddNew(); setIsOpen(false); setSearch(""); }}>
                <PlusCircle className="w-4 h-4 shrink-0" /> <span className="truncate">{newItemLabel}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AcquisitionsPage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [lots, setLots] = useState<EnrichedLot[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyData>({ categories: [], brands: [], lots: [], sizes: [], colors: [], stores: [] });

  const [openLotForm, setOpenLotForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingLot, setEditingLot] = useState<EnrichedLot | null>(null);
  const [lotToDelete, setLotToDelete] = useState<string | null>(null);
  const [lotStoreId, setLotStoreId] = useState("");

  const [openPieceForm, setOpenPieceForm] = useState(false);
  const [targetLotForPiece, setTargetLotForPiece] = useState<EnrichedLot | null>(null);
  const [catId, setCatId] = useState(""); 
  const [brandId, setBrandId] = useState("");
  const [sizeId, setSizeId] = useState(""); 
  const [colorId, setColorId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quickAdd, setQuickAdd] = useState({ isOpen: false, type: "", label: "", context: "" });
  const [quickAddValue, setQuickAddValue] = useState("");

  const loadData = async (cid: string) => {
    const [lData, tData] = await Promise.all([getLotsAction(cid), getTaxonomyAction(cid)]);
    setLots(lData as EnrichedLot[]);
    setTaxonomy(tData as TaxonomyData);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const status = await checkOnboardingStatusAction();
      if (status.success && status.companyId) {
        if (isMounted) setCompanyId(status.companyId);
        const [lData, tData] = await Promise.all([getLotsAction(status.companyId), getTaxonomyAction(status.companyId)]);
        if (isMounted) {
          setLots(lData as EnrichedLot[]);
          setTaxonomy(tData as TaxonomyData);
        }
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleEditClick = (lot: EnrichedLot) => { 
    setEditingLot(lot); 
    const matchedStore = taxonomy.stores.find(s => s.name === lot.sourceName);
    setLotStoreId(matchedStore ? matchedStore.id : "");
    setOpenLotForm(true); 
  };
  
  const handleCloseLotModal = (val: boolean) => { 
    setOpenLotForm(val); 
    if (!val) {
      setEditingLot(null);
      setLotStoreId("");
      setQuickAdd({ isOpen: false, type: "", label: "", context: "" });
    }
  };

  async function handleLotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!companyId) return;

    if (!lotStoreId) {
      showBanner("Por favor, selecione ou cadastre o fornecedor/parceiro.", "error");
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const dateValue = formData.get("purchaseDate") as string;
    const storeName = taxonomy.stores.find(s => s.id === lotStoreId)?.name || "Fornecedor Indefinido";
    
    const data = {
      code: editingLot ? editingLot.code : "", 
      purchaseDate: dateValue ? new Date(dateValue) : new Date(),
      sourceName: storeName, 
      sourceType: "OUTRO" as SourceType, 
      totalCost: Number(formData.get("totalCost")), 
      quantity: Number(formData.get("quantity")), 
      notes: formData.get("notes") as string,
    };

    const result = editingLot ? await updateLotAction(editingLot.id, companyId, data) : await createLotAction(companyId, data);
    setLoading(false);

    if (result.success) {
      handleCloseLotModal(false);
      showBanner(editingLot ? "Lote atualizado!" : "Lote cadastrado com sucesso!", "success");
      await loadData(companyId);
    } else {
      showBanner(result.error || "Erro ao guardar.", "error");
    }
  }

  async function confirmDelete() {
    if (!lotToDelete || !companyId) return;
    setLoading(true); const result = await deleteLotAction(lotToDelete, companyId); setLoading(false);
    if (result.success) { showBanner("Excluída com sucesso!", "success"); await loadData(companyId); }
    else { showBanner(result.error || "Erro ao excluir.", "error"); }
    setLotToDelete(null);
  }

  const openPieceEntry = (lot: EnrichedLot) => { setTargetLotForPiece(lot); setOpenPieceForm(true); };
  const closePieceEntry = (val: boolean) => {
    setOpenPieceForm(val);
    if (!val) {
      setCatId(""); setBrandId(""); setSizeId(""); setColorId(""); setStoreId(""); setSelectedTags([]);
      setImageFile(null); setImagePreview(null); setTargetLotForPiece(null);
      setQuickAdd({ isOpen: false, type: "", label: "", context: "" });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]; setImageFile(file); setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleTag = (tag: string) => {
    if (tag === "Vendida") setSelectedTags(prev => prev.includes("Vendida") ? [] : ["Vendida"]);
    else setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag).filter(t => t !== "Vendida") : [...prev, tag].filter(t => t !== "Vendida"));
  };

  const triggerQuickAdd = (type: string, label: string, context: string) => { 
    setQuickAdd({ isOpen: true, type, label, context }); 
    setQuickAddValue(""); 
  };

  const handleSaveQuickAdd = async () => {
    if (!quickAddValue || !companyId) return;
    setLoading(true); let newRec;
    if (quickAdd.type === 'category') newRec = await quickAddCategory(companyId, quickAddValue);
    if (quickAdd.type === 'brand') newRec = await quickAddBrand(companyId, quickAddValue);
    if (quickAdd.type === 'size') newRec = await quickAddSize(companyId, quickAddValue);
    if (quickAdd.type === 'color') newRec = await quickAddColor(companyId, quickAddValue);
    if (quickAdd.type === 'store') newRec = await quickAddStore(companyId, quickAddValue);
    
    await loadData(companyId); 
    
    if (quickAdd.context === 'lot') {
      if (quickAdd.type === 'store' && newRec) setLotStoreId(newRec.id);
    } else {
      if (quickAdd.type === 'category' && newRec) setCatId(newRec.id);
      if (quickAdd.type === 'brand' && newRec) setBrandId(newRec.id);
      if (quickAdd.type === 'size' && newRec) setSizeId(newRec.id);
      if (quickAdd.type === 'color' && newRec) setColorId(newRec.id);
      if (quickAdd.type === 'store' && newRec) setStoreId(newRec.id);
    }
    
    setLoading(false); setQuickAdd({ isOpen: false, type: "", label: "", context: "" });
  };

  async function handlePieceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!companyId || !targetLotForPiece) return;
    const formData = new FormData(event.currentTarget);
    setLoading(true); let finalImg = imagePreview; 

    if (imageFile) {
      setIsUploading(true);
      try {
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(imageFile.name)}`, { method: "POST", body: imageFile });
        if (res.ok) { const blob = await res.json(); finalImg = blob.url; }
      } catch { showBanner("Erro no upload da foto.", "error"); }
      setIsUploading(false);
    }

    const c = taxonomy.categories.find(x => x.id === catId)?.name || "";
    const b = taxonomy.brands.find(x => x.id === brandId)?.name || "";
    const s = taxonomy.sizes.find(x => x.id === sizeId)?.name || "";
    const co = taxonomy.colors.find(x => x.id === colorId)?.name || "";
    const name = [c, b, s ? `Tamanho ${s}` : "", co].filter(Boolean).join(" ") || "Nova Peça do Lote";

    const data = {
      name, categoryId: catId, brandId: brandId, sizeId: sizeId, colorId: colorId, tags: selectedTags, 
      observations: formData.get("observations") as string, lotId: targetLotForPiece.id, storeId: selectedTags.includes("Em consignação") ? (storeId || null) : null, 
      purchasePrice: targetLotForPiece.averageCost, registerSale: selectedTags.includes("Vendida"), salePrice: selectedTags.includes("Vendida") ? Number(formData.get("salePrice")) : undefined,
      imageUrl: finalImg && !finalImg.startsWith('blob:') ? finalImg : undefined
    };

    const result = await createPieceAction(companyId, data);
    setLoading(false); 
    if (result.success) { 
        showBanner("Peça adicionada ao lote!", "success"); 
        await loadData(companyId); 
        setCatId(""); setBrandId(""); setSizeId(""); setColorId(""); setSelectedTags([]); setImageFile(null); setImagePreview(null);
    } else { showBanner(result.error || "Erro.", "error"); }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const formatDate = (date: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(date));

  const fornecedoresOptions = taxonomy.stores;

  if (!companyId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center text-zinc-500">
          <Layers className="w-8 h-8 animate-pulse mb-2 text-[#1E5AA8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-6">
      {banner.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl transition-all min-w-80 ${banner.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Garimpos & Lotes</h1>
          <p className="text-[#4B4B4B] mt-1 text-sm md:text-base">Gere o ROI das suas compras em atacado e lotes fechados.</p>
        </div>

        <div className="flex items-center w-full sm:w-auto">
          <Dialog open={openLotForm} onOpenChange={handleCloseLotModal}>
            <DialogTrigger className="flex flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Novo Lote
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
              {quickAdd.isOpen && quickAdd.context === 'lot' ? (
                <div className="space-y-6 py-2">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setQuickAdd({ isOpen: false, type: "", label: "", context: "" })} className="p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                      <ArrowLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                    <div><DialogTitle className="text-[#0A244A]">Cadastrar Fornecedor</DialogTitle></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0A244A]">Nome do {quickAdd.label}</Label>
                    <Input autoFocus value={quickAddValue} onChange={(e) => setQuickAddValue(e.target.value)} />
                  </div>
                  <Button onClick={handleSaveQuickAdd} className="w-full bg-[#1E5AA8] hover:bg-[#103A73] text-white" disabled={loading || !quickAddValue}>
                    {loading ? "A processar..." : "Salvar e Voltar"}
                  </Button>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-[#0A244A]">{editingLot ? "Editar Lote" : "Novo Lote"}</DialogTitle>
                    <DialogDescription className="text-[#4B4B4B] text-xs sm:text-sm">
                      Insira o fornecedor e quanto pagou na sacola fechada.
                    </DialogDescription>
                  </DialogHeader>

                  <form key={editingLot?.id || "new"} onSubmit={handleLotSubmit} className="space-y-5 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Onde você foi? (Fornecedor)</Label>
                        <SearchableSelect 
                          value={lotStoreId} 
                          onChange={setLotStoreId} 
                          options={fornecedoresOptions} 
                          placeholder="Selecione o fornecedor..." 
                          newItemLabel="Cadastrar Fornecedor" 
                          onAddNew={() => triggerQuickAdd('store', 'Fornecedor', 'lot')} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="purchaseDate" className="text-[#0A244A]">Data do Garimpo</Label>
                        <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={editingLot ? new Date(editingLot.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required className="h-10" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1E5AA8]/5 p-4 border border-[#1E5AA8]/20 rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="quantity" className="text-[#0A244A] font-bold">Total de Peças na Sacola</Label>
                        <Input id="quantity" name="quantity" type="number" min="1" placeholder="Ex: 50" defaultValue={editingLot?.quantity || ""} required className="h-10 bg-white" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="totalCost" className="text-[#0A244A] font-bold">Custo Total Pago (R$)</Label>
                        <Input id="totalCost" name="totalCost" type="number" step="0.01" min="0" placeholder="Ex: 250.00" defaultValue={editingLot?.totalCost || ""} required className="h-10 bg-white" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="notes" className="text-[#0A244A]">Observações (Opcional)</Label>
                      <Input id="notes" name="notes" placeholder="Ex: Foco em roupas de inverno..." defaultValue={editingLot?.notes || ""} className="h-10" />
                    </div>

                    <Button type="submit" className="w-full mt-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-12 text-base shadow-sm font-medium flex items-center justify-center gap-2" disabled={loading}>
                      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                      {loading ? "A processar..." : "Salvar Lote"}
                    </Button>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={!!lotToDelete} onOpenChange={(val) => !val && setLotToDelete(null)}>
            <DialogContent className="w-[90vw] sm:max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-zinc-600 mt-3 text-sm md:text-base">
                  Tem certeza que deseja excluir? Se existirem peças vinculadas a esta ida ao brechó no estoque, a exclusão será bloqueada.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 cursor-pointer h-11" onClick={() => setLotToDelete(null)} disabled={loading}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer h-11" onClick={confirmDelete} disabled={loading}>
                  {loading ? "A processar..." : "Sim, Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openPieceForm} onOpenChange={closePieceEntry}>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
              {quickAdd.isOpen && quickAdd.context === 'piece' ? (
                <div className="space-y-6 py-2">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setQuickAdd({ isOpen: false, type: "", label: "", context: "" })} className="p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                      <ArrowLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                    <div><DialogTitle className="text-[#0A244A]">Novo Cadastro</DialogTitle></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0A244A]">Nome da {quickAdd.label}</Label>
                    <Input autoFocus value={quickAddValue} onChange={(e) => setQuickAddValue(e.target.value)} />
                  </div>
                  <Button onClick={handleSaveQuickAdd} className="w-full bg-[#1E5AA8] hover:bg-[#103A73] text-white" disabled={loading || !quickAddValue}>
                    {loading ? "A processar..." : "Salvar e Voltar"}
                  </Button>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-[#0A244A] flex flex-col">
                        Registrar Peça do Lote
                        <span className="text-sm font-normal text-zinc-500 mt-1">Destino: {targetLotForPiece?.sourceName} (Custo médio: {formatCurrency(targetLotForPiece?.averageCost || 0)})</span>
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePieceSubmit} className="space-y-5 pt-2">
                    <div className="flex justify-center mb-4">
                      <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                      <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 overflow-hidden relative group">
                        {imagePreview ? (
                          <><Image src={imagePreview} alt="Preview" fill className="object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Camera className="w-8 h-8 text-white" /></div></>
                        ) : (
                          <><Camera className="w-8 h-8 text-zinc-400 mb-2" /><span className="text-xs text-zinc-500">Tirar Foto</span></>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Categoria</Label><SearchableSelect value={catId} onChange={setCatId} options={taxonomy.categories} placeholder="Selecione" newItemLabel="Nova Categoria" onAddNew={() => triggerQuickAdd('category', 'Categoria', 'piece')} /></div>
                      <div><Label>Marca</Label><SearchableSelect value={brandId} onChange={setBrandId} options={taxonomy.brands} placeholder="Selecione" newItemLabel="Nova Marca" onAddNew={() => triggerQuickAdd('brand', 'Marca', 'piece')} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Tamanho</Label><SearchableSelect value={sizeId} onChange={setSizeId} options={taxonomy.sizes} placeholder="Selecione" newItemLabel="Novo Tamanho" onAddNew={() => triggerQuickAdd('size', 'Tamanho', 'piece')} /></div>
                      <div><Label>Cor</Label><SearchableSelect value={colorId} onChange={setColorId} options={taxonomy.colors} placeholder="Selecione" newItemLabel="Nova Cor" onAddNew={() => triggerQuickAdd('color', 'Cor', 'piece')} /></div>
                    </div>
                    <div className="space-y-3 bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                      <Label className="flex items-center gap-2"><Tag className="w-4 h-4" /> Etiquetas (Estado Atual)</Label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map(tag => (
                          <button type="button" key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${selectedTags.includes(tag) ? TAG_COLORS[tag] : "bg-white text-zinc-500 hover:bg-zinc-100"}`}>{tag}</button>
                        ))}
                      </div>
                      {selectedTags.includes("Em consignação") && (
                         <div className="mt-4 pt-4 border-t"><Label>Parceiro (Consignação)</Label><SearchableSelect value={storeId} onChange={setStoreId} options={taxonomy.stores} placeholder="Onde está a peça?" newItemLabel="Novo Parceiro" onAddNew={() => triggerQuickAdd('store', 'Parceiro', 'piece')} /></div>
                      )}
                      {selectedTags.includes("Vendida") && (
                         <div className="mt-4 pt-4 border-t"><Label>Valor Efetivo da Venda (R$)</Label><Input name="salePrice" type="number" step="0.01" required /></div>
                      )}
                    </div>
                    <div><Label>Observações</Label><Input name="observations" placeholder="Fio puxado, mancha pequena..." /></div>
                    <Button type="submit" className="w-full bg-[#1E5AA8] h-12 flex gap-2 font-medium cursor-pointer" disabled={loading || isUploading}>
                      {(loading || isUploading) && <Loader2 className="w-5 h-5 animate-spin" />}
                      {isUploading ? "A enviar foto..." : "Salvar e Continuar Lançando"}
                    </Button>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>

        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {lots.length === 0 ? (
          <div className="p-12 md:p-16 text-center flex flex-col items-center justify-center">
            <Layers className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhum lote registado</h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              Sempre que voltar do brechó ou fornecedor com uma sacola, registe o lote aqui!
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col divide-y divide-zinc-100">
              {lots.map((lot) => {
                const piecesPercent = Math.min((lot.registeredPieces / lot.quantity) * 100, 100);
                const roiPercent = lot.totalCost > 0 ? (lot.expectedRevenue / lot.totalCost) * 100 : 100;
                const roiCapped = Math.min(roiPercent, 100);
                
                return (
                  <div key={lot.id} className="p-4 flex flex-col gap-3 hover:bg-zinc-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-[#0A244A] text-sm leading-tight">{lot.sourceName}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded">{formatDate(lot.purchaseDate)}</span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded-sm">
                            <MapPin className="w-3 h-3" /> Lote
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleEditClick(lot)} className="p-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-md transition-colors cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setLotToDelete(lot.id)} className="p-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-md transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1 bg-zinc-50 border border-zinc-200 rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                          <Package className="w-3 h-3"/> Triagem (Quant.)
                        </span>
                        <span className="text-[10px] font-bold text-[#0A244A]">{lot.registeredPieces} de {lot.quantity}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${piecesPercent === 100 ? 'bg-emerald-500' : 'bg-[#1E5AA8]'}`} style={{ width: `${piecesPercent}%` }} />
                      </div>

                      <div className="flex justify-between items-center mb-1.5 mt-3">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                          <DollarSign className="w-3 h-3"/> Retorno do Invest.
                        </span>
                        <span className={`text-[10px] font-bold ${roiPercent >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {formatCurrency(lot.expectedRevenue)} / {formatCurrency(lot.totalCost)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${roiPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${roiCapped}%` }} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-zinc-100">
                         <div>
                            <span className="flex text-[9px] uppercase text-zinc-500 font-semibold items-center gap-1 mb-0.5">Custo Médio</span>
                            <p className="font-bold text-rose-600 text-xs">{formatCurrency(lot.averageCost)} /peça</p>
                         </div>
                         <div className="text-right">
                            <span className="flex justify-end text-[9px] uppercase text-zinc-500 font-semibold items-center gap-1 mb-0.5">
                              Lucro Final <TrendingUp className="w-3 h-3 text-emerald-500"/>
                            </span>
                            <p className={`font-bold text-xs ${lot.expectedProfit > 0 ? 'text-emerald-600' : 'text-zinc-500'}`}>
                              {formatCurrency(lot.expectedProfit)}
                            </p>
                         </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-200">
                         <Button onClick={() => openPieceEntry(lot)} className="w-full bg-[#1E5AA8] hover:bg-[#103A73] text-white flex gap-2 h-11 cursor-pointer font-bold">
                            <PlusCircle className="w-4 h-4"/> LANÇAR PEÇA DO LOTE
                         </Button>
                      </div>
                    </div>

                    {lot.notes && (
                      <div className="mt-1 bg-amber-50 px-2 py-1.5 rounded-md text-xs text-amber-700 flex items-start gap-1.5 border border-amber-100">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="leading-tight">{lot.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {lots.map(lot => {
                  const piecesPercent = Math.min((lot.registeredPieces / lot.quantity) * 100, 100);
                  const roiPercent = lot.totalCost > 0 ? (lot.expectedRevenue / lot.totalCost) * 100 : 100;
                  const roiCapped = Math.min(roiPercent, 100);

                  return (
                    <div key={lot.id} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-[#0A244A] text-lg leading-tight">{lot.sourceName}</h3>
                            <p className="text-[11px] text-zinc-500 mt-1">{formatDate(lot.purchaseDate)}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditClick(lot)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"><Pencil className="w-3.5 h-3.5"/></button>
                            <button onClick={() => setLotToDelete(lot.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>

                        {lot.notes && (
                          <div className="mb-4 bg-amber-50 px-2 py-1.5 rounded-md text-[11px] text-amber-700 flex items-start gap-1.5 border border-amber-100">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="leading-tight">{lot.notes}</span>
                          </div>
                        )}

                        <div className="bg-zinc-50 rounded-lg p-4 mb-4 border border-zinc-100 space-y-4">
                          
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Package className="w-3.5 h-3.5"/> Qtd. Peças</span>
                              <span className="text-[10px] font-bold text-[#0A244A]">{lot.registeredPieces} / {lot.quantity}</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                              <div className={`h-full ${piecesPercent === 100 ? 'bg-emerald-500' : 'bg-[#1E5AA8]'}`} style={{width: `${piecesPercent}%`}}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/> Retorno (ROI)</span>
                              <span className={`text-[10px] font-bold ${roiPercent >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {formatCurrency(lot.expectedRevenue)} / {formatCurrency(lot.totalCost)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                              <div className={`h-full ${roiPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{width: `${roiCapped}%`}}></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-200">
                              <div>
                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Custo Médio</p>
                                <p className="font-bold text-rose-600 text-xs mt-0.5">{formatCurrency(lot.averageCost)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] text-zinc-500 uppercase font-bold flex justify-end gap-1 items-center">Lucro <TrendingUp className="w-3 h-3 text-emerald-500"/></p>
                                <p className={`font-bold text-xs mt-0.5 ${lot.expectedProfit > 0 ? 'text-emerald-600' : 'text-zinc-500'}`}>{formatCurrency(lot.expectedProfit)}</p>
                              </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-2 border-t border-zinc-100 flex gap-2">
                          <Link href={`/dashboard/inventory?filterLot=${lot.id}`} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold py-2 rounded-md transition-colors cursor-pointer">
                            <Package className="w-4 h-4" /> Estoque
                          </Link>
                          <Button onClick={() => openPieceEntry(lot)} className="flex-2 bg-[#1E5AA8] hover:bg-[#103A73] text-white flex gap-1.5 h-auto py-2 cursor-pointer font-bold text-xs">
                            <PlusCircle className="w-4 h-4"/> Lançar Peça
                          </Button>
                        </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}