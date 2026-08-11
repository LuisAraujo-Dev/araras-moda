"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, PlusCircle, Tag, CheckCircle2, AlertCircle, Pencil, Trash2, Store, ArrowLeft, ChevronDown, Search, Check, ImageIcon, Camera, SlidersHorizontal, Settings2, X } from "lucide-react";
import { getPiecesAction, createPieceAction, updatePieceAction, deletePieceAction, getTaxonomyAction, quickAddCategory, quickAddBrand, quickAddSize, quickAddColor, quickAddLot, quickAddStore, deleteTaxonomyAction } from "@/app/actions/piece.actions";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";
import { Category, Brand, Lot, Size, Color, Piece, Store as StoreModel, PieceImage } from "@prisma/client";

type PieceWithRelations = Piece & {
  category: Category; 
  brand: Brand; 
  lot: Lot; 
  size: Size | null; 
  color: Color | null; 
  store: StoreModel | null;
  images: PieceImage[];
  tags: string[]; 
  observations: string | null;
};

type TaxonomyData = {
  categories: Category[]; 
  brands: Brand[]; 
  lots: Lot[]; 
  sizes: Size[]; 
  colors: Color[]; 
  stores: StoreModel[];
};

const TAG_COLORS: Record<string, string> = {
  "Higienização": "bg-cyan-100 text-cyan-900 border-cyan-200 hover:bg-cyan-200",
  "Conserto": "bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200",
  "Em consignação": "bg-purple-100 text-purple-900 border-purple-400 hover:bg-purple-200",
  "Postada": "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200",
  "Em estoque": "bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200",
  "Para doação": "bg-teal-100 text-teal-900 border-teal-200 hover:bg-teal-200",
  "Doada": "bg-zinc-200 text-zinc-900 border-zinc-300 hover:bg-zinc-300",
  "Vendida": "bg-lime-100 text-lime-900 border-lime-500 hover:bg-lime-200",
  "Descartada": "bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200",
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

export default function InventoryPage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [pieces, setPieces] = useState<PieceWithRelations[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyData>({ categories: [], brands: [], lots: [], sizes: [], colors: [], stores: [] });
  const [open, setOpen] = useState(false);
  
  const [manageAttrOpen, setManageAttrOpen] = useState(false);
  const [attrTab, setAttrTab] = useState<'categories'|'brands'|'sizes'|'colors'>('categories');

  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingPiece, setEditingPiece] = useState<PieceWithRelations | null>(null);
  const [pieceToDelete, setPieceToDelete] = useState<string | null>(null);

  const [catId, setCatId] = useState(""); const [brandId, setBrandId] = useState("");
  const [sizeId, setSizeId] = useState(""); const [colorId, setColorId] = useState("");
  const [lotId, setLotId] = useState(""); const [storeId, setStoreId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [advFilters, setAdvFilters] = useState({ category: "", brand: "", lot: "", store: "", size: "", color: "" });

  const [images, setImages] = useState<{ url: string; file: File | null }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quickAdd, setQuickAdd] = useState({ isOpen: false, type: "", label: "" });
  const [quickAddValue, setQuickAddValue] = useState("");

  const isConsigned = selectedTags.includes("Em consignação");
  const isAlreadySold = editingPiece?.tags.includes("Vendida");
  const isNowSold = selectedTags.includes("Vendida");
  const showSalePriceInput = !isAlreadySold && isNowSold;

  const loadData = async (cid: string) => {
    const [p, t] = await Promise.all([getPiecesAction(cid), getTaxonomyAction(cid)]);
    setPieces(p as PieceWithRelations[]); setTaxonomy(t as TaxonomyData);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const paramLotId = params.get("lotId");
    const filterLotId = params.get("filterLot");

    if (action === "new" && paramLotId) {
      setTimeout(() => {
        setLotId(paramLotId); 
        setOpen(true);
      }, 0);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (filterLotId) {
      setTimeout(() => {
        setAdvFilters(prev => ({ ...prev, lot: filterLotId })); 
        setShowFilters(true);
      }, 0);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    let isMounted = true;
    const fetchInitialData = async () => {
      const status = await checkOnboardingStatusAction();
      if (status.success && status.companyId) {
        if (isMounted) setCompanyId(status.companyId);
        const [p, t] = await Promise.all([getPiecesAction(status.companyId), getTaxonomyAction(status.companyId)]);
        if (isMounted) { setPieces(p as PieceWithRelations[]); setTaxonomy(t as TaxonomyData); }
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (m: string, t: "success" | "error") => { setBanner({ show: true, message: m, type: t }); setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000); };

  const triggerQuickAdd = (type: string, label: string) => { setQuickAdd({ isOpen: true, type, label }); setQuickAddValue(""); };

  const handleSaveQuickAdd = async () => {
    if (!quickAddValue || quickAddValue.trim() === "" || !companyId) return;
    setLoading(true); let newRecord;
    if (quickAdd.type === 'category') newRecord = await quickAddCategory(companyId, quickAddValue);
    if (quickAdd.type === 'brand') newRecord = await quickAddBrand(companyId, quickAddValue);
    if (quickAdd.type === 'size') newRecord = await quickAddSize(companyId, quickAddValue);
    if (quickAdd.type === 'color') newRecord = await quickAddColor(companyId, quickAddValue);
    if (quickAdd.type === 'lot') newRecord = await quickAddLot(companyId, quickAddValue);
    if (quickAdd.type === 'store') newRecord = await quickAddStore(companyId, quickAddValue);
    
    await loadData(companyId); 
    if (quickAdd.type === 'category' && newRecord) setCatId(newRecord.id);
    if (quickAdd.type === 'brand' && newRecord) setBrandId(newRecord.id);
    if (quickAdd.type === 'size' && newRecord) setSizeId(newRecord.id);
    if (quickAdd.type === 'color' && newRecord) setColorId(newRecord.id);
    if (quickAdd.type === 'lot' && newRecord) setLotId(newRecord.id);
    if (quickAdd.type === 'store' && newRecord) setStoreId(newRecord.id);
    setLoading(false); setQuickAdd({ isOpen: false, type: "", label: "" });
  };

  const handleDeleteAttr = async (tab: string, id: string) => {
    if (!companyId) return;
    const typeMap: Record<string, 'category'|'brand'|'size'|'color'> = { 'categories': 'category', 'brands': 'brand', 'sizes': 'size', 'colors': 'color' };
    setLoading(true); const result = await deleteTaxonomyAction(typeMap[tab], id, companyId); setLoading(false);
    if (result.success) { showBanner("Excluído!", "success"); await loadData(companyId); } else { showBanner(result.error || "Erro ao excluir.", "error"); }
  };

  const toggleTag = (tag: string) => {
    if (tag === "Vendida") setSelectedTags(prev => prev.includes("Vendida") ? [] : ["Vendida"]);
    else setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag).filter(t => t !== "Vendida") : [...prev, tag].filter(t => t !== "Vendida"));
  };

  const toggleFilterTag = (tag: string) => setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        url: URL.createObjectURL(file),
        file
      }));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditClick = (piece: PieceWithRelations) => {
    setEditingPiece(piece); setCatId(piece.categoryId); setBrandId(piece.brandId);
    setSizeId(piece.sizeId || ""); setColorId(piece.colorId || ""); setLotId(piece.lotId); setStoreId(piece.storeId || ""); 
    setSelectedTags(piece.tags || []); 
    setImages(piece.images?.map(img => ({ url: img.imageUrl, file: null })) || []);
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setEditingPiece(null); setQuickAdd({ isOpen: false, type: "", label: "" });
      setCatId(""); setBrandId(""); setSizeId(""); setColorId(""); setLotId(""); setStoreId(""); setSelectedTags([]);
      setImages([]);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!companyId) return;
    const formData = new FormData(event.currentTarget);
    setLoading(true); setIsUploading(true);
    const finalImageUrls: string[] = []; 

    for (const img of images) {
      if (img.file) {
        try {
          const res = await fetch(`/api/upload?filename=${encodeURIComponent(img.file.name)}`, { method: "POST", body: img.file });
          if (res.ok) { const blob = await res.json(); finalImageUrls.push(blob.url); }
        } catch { showBanner("Erro na foto.", "error"); }
      } else {
        finalImageUrls.push(img.url);
      }
    }
    setIsUploading(false);

    const c = taxonomy.categories.find(x => x.id === catId)?.name || "";
    const b = taxonomy.brands.find(x => x.id === brandId)?.name || "";
    const s = taxonomy.sizes.find(x => x.id === sizeId)?.name || "";
    const co = taxonomy.colors.find(x => x.id === colorId)?.name || "";
    const autoName = [c, b, s ? `Tamanho ${s}` : "", co].filter(Boolean).join(" ") || "Nova Peça";

    const data = {
      name: autoName, categoryId: catId, brandId: brandId, sizeId: sizeId, colorId: colorId, tags: selectedTags, observations: formData.get("observations") as string, 
      lotId: lotId, storeId: isConsigned ? (storeId || null) : null, purchasePrice: Number(formData.get("purchasePrice")), registerSale: showSalePriceInput, 
      salePrice: showSalePriceInput ? Number(formData.get("salePrice")) : undefined, 
      imageUrl: finalImageUrls[0] || undefined,
      imageUrls: finalImageUrls
    };

    const result = editingPiece ? await updatePieceAction(editingPiece.id, companyId, data) : await createPieceAction(companyId, data);
    setLoading(false); 

    if (result.success) {
      handleCloseModal(false); showBanner(editingPiece ? "Atualizada!" : "Guardada!", "success"); await loadData(companyId);
    } else { showBanner(result.error || "Erro.", "error"); }
  }

  async function confirmDelete() {
    if (!pieceToDelete || !companyId) return;
    setLoading(true); await deletePieceAction(pieceToDelete, companyId); setLoading(false);
    showBanner("Excluída!", "success"); setPieceToDelete(null); await loadData(companyId);
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const filteredPieces = pieces.filter(piece => {
    if (filterTags.length > 0 && !filterTags.some(tag => piece.tags.includes(tag))) return false;
    if (searchTerm) { const term = searchTerm.toLowerCase(); if (!piece.name.toLowerCase().includes(term) && !piece.code.toLowerCase().includes(term)) return false; }
    if (advFilters.category && piece.categoryId !== advFilters.category) return false;
    if (advFilters.brand && piece.brandId !== advFilters.brand) return false;
    if (advFilters.lot && piece.lotId !== advFilters.lot) return false;
    if (advFilters.store && piece.storeId !== advFilters.store) return false;
    if (advFilters.size && piece.sizeId !== advFilters.size) return false;
    if (advFilters.color && piece.colorId !== advFilters.color) return false;
    return true;
  });

  filteredPieces.sort((a, b) => {
    if (sortBy === "price_asc") return a.purchasePrice - b.purchasePrice;
    if (sortBy === "price_desc") return b.purchasePrice - a.purchasePrice;
    return 0;
  });

  if (!companyId) return <div className="flex h-[60vh] items-center justify-center"><Package className="w-8 h-8 animate-pulse text-[#1E5AA8]" /></div>;

  return (
    <div className="space-y-6 relative pb-6">
      {banner.show && (
        <div className={`fixed top-6 right-6 z-100 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl ${banner.type === "success" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Minha Arara</h1>
          <p className="text-[#4B4B4B] mt-1 text-sm md:text-base">Gerencie peças e controle o seu estoque.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog open={manageAttrOpen} onOpenChange={setManageAttrOpen}>
            <DialogTrigger className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 h-10 px-4 rounded-md text-sm font-medium">
              <Settings2 className="w-4 h-4" /> Atributos
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-xl">
              <div className="p-5 pb-3 border-b border-zinc-100">
                <DialogTitle className="text-[#0A244A]">Gerenciar Atributos</DialogTitle>
              </div>
              <div className="px-5 pt-3 border-b border-zinc-100 flex gap-4 overflow-x-auto custom-scrollbar">
                <button onClick={() => setAttrTab('categories')} className={`pb-2 text-sm font-medium ${attrTab === 'categories' ? 'border-b-2 border-[#1E5AA8] text-[#1E5AA8]' : 'text-zinc-500'}`}>Categorias</button>
                <button onClick={() => setAttrTab('brands')} className={`pb-2 text-sm font-medium ${attrTab === 'brands' ? 'border-b-2 border-[#1E5AA8] text-[#1E5AA8]' : 'text-zinc-500'}`}>Marcas</button>
                <button onClick={() => setAttrTab('sizes')} className={`pb-2 text-sm font-medium ${attrTab === 'sizes' ? 'border-b-2 border-[#1E5AA8] text-[#1E5AA8]' : 'text-zinc-500'}`}>Tamanhos</button>
                <button onClick={() => setAttrTab('colors')} className={`pb-2 text-sm font-medium ${attrTab === 'colors' ? 'border-b-2 border-[#1E5AA8] text-[#1E5AA8]' : 'text-zinc-500'}`}>Cores</button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 max-h-[50vh]">
                {taxonomy[attrTab]?.map(item => (
                  <div key={item.id} className="flex justify-between p-2.5 border rounded-md mb-2">
                    <span className="text-sm">{item.name}</span>
                    <button onClick={() => handleDeleteAttr(attrTab, item.id)} className="text-zinc-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex gap-2 bg-[#1E5AA8] hover:bg-[#103A73] text-white h-10 px-4 rounded-md text-sm font-medium items-center">
              <PlusCircle className="w-4 h-4" /> Cadastrar Peça
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
              {quickAdd.isOpen ? (
                <div className="space-y-6 py-2">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setQuickAdd({ isOpen: false, type: "", label: "" })} className="p-2 hover:bg-zinc-100 rounded-full"><ArrowLeft className="w-5 h-5 text-zinc-600" /></button>
                    <DialogTitle>Novo Cadastro</DialogTitle>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da {quickAdd.label}</Label>
                    <Input autoFocus value={quickAddValue} onChange={(e) => setQuickAddValue(e.target.value)} />
                  </div>
                  <Button onClick={handleSaveQuickAdd} className="w-full bg-[#1E5AA8] text-white">Salvar e Voltar</Button>
                </div>
              ) : (
                <>
                  <DialogHeader><DialogTitle>{editingPiece ? "Editar Peça" : "Cadastrar Peça"}</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    
                    <div className="space-y-3 mb-4">
                      <Label className="text-[#0A244A]">Fotos da Peça</Label>
                      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-32 rounded-lg border border-zinc-200 overflow-hidden shrink-0 group">
                            <Image src={img.url} alt={`Foto ${idx + 1}`} fill className="object-cover" />
                            <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-32 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center text-zinc-400 hover:text-[#1E5AA8] hover:border-[#1E5AA8] transition-colors shrink-0 cursor-pointer">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-medium text-center">Adicionar<br/>Foto</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Categoria</Label><SearchableSelect value={catId} onChange={setCatId} options={taxonomy.categories} placeholder="Selecione" newItemLabel="Nova Categoria" onAddNew={() => triggerQuickAdd('category', 'Categoria')} /></div>
                      <div><Label>Marca</Label><SearchableSelect value={brandId} onChange={setBrandId} options={taxonomy.brands} placeholder="Selecione" newItemLabel="Nova Marca" onAddNew={() => triggerQuickAdd('brand', 'Marca')} /></div>
                      <div><Label>Tamanho</Label><SearchableSelect value={sizeId} onChange={setSizeId} options={taxonomy.sizes} placeholder="Selecione" newItemLabel="Novo Tamanho" onAddNew={() => triggerQuickAdd('size', 'Tamanho')} /></div>
                      <div><Label>Cor</Label><SearchableSelect value={colorId} onChange={setColorId} options={taxonomy.colors} placeholder="Selecione" newItemLabel="Nova Cor" onAddNew={() => triggerQuickAdd('color', 'Cor')} /></div>
                      <div><Label>Origem</Label><SearchableSelect value={lotId} onChange={setLotId} options={taxonomy.lots} placeholder="Selecione" newItemLabel="Nova Origem" onAddNew={() => triggerQuickAdd('lot', 'Origem')} /></div>
                      <div><Label>Custo (R$)</Label><Input name="purchasePrice" type="number" step="0.01" defaultValue={editingPiece?.purchasePrice || ""} required /></div>
                    </div>
                    <div className="space-y-3 bg-zinc-50 border rounded-lg p-4">
                      <Label className="flex items-center gap-2"><Tag className="w-4 h-4" /> Etiquetas</Label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map(tag => (
                          <button type="button" key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 text-xs font-medium rounded-full border ${selectedTags.includes(tag) ? TAG_COLORS[tag] : "bg-white"}`}>{tag}</button>
                        ))}
                      </div>
                    </div>
                    <div><Label>Observações</Label><Input name="observations" defaultValue={editingPiece?.observations || ""} /></div>
                    <Button type="submit" className="w-full bg-[#1E5AA8] text-white" disabled={loading}>{loading || isUploading ? "Processando..." : "Salvar"}</Button>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={!!pieceToDelete} onOpenChange={(val) => !val && setPieceToDelete(null)}>
            <DialogContent className="sm:max-w-md rounded-xl">
              <DialogHeader><DialogTitle className="text-rose-600">Excluir Peça?</DialogTitle></DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setPieceToDelete(null)}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 text-white" onClick={confirmDelete}>Sim, Excluir</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {pieces.length > 0 && (
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input className="pl-9 h-10 border-zinc-300" placeholder="Buscar por nome ou SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-10 bg-white" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="w-4 h-4" /> Filtros</Button>
                <select className="h-10 border rounded-md px-3 bg-white" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Mais Recentes</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                </select>
              </div>
            </div>
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-3 border-t">
                <div className="space-y-1"><label className="text-xs">Categoria</label><select className="w-full h-9 border rounded px-2" value={advFilters.category} onChange={e => setAdvFilters({...advFilters, category: e.target.value})}><option value="">Todas</option>{taxonomy.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs">Marca</label><select className="w-full h-9 border rounded px-2" value={advFilters.brand} onChange={e => setAdvFilters({...advFilters, brand: e.target.value})}><option value="">Todas</option>{taxonomy.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs">Origem</label><select className="w-full h-9 border rounded px-2" value={advFilters.lot} onChange={e => setAdvFilters({...advFilters, lot: e.target.value})}><option value="">Todas</option>{taxonomy.lots.map(l => <option key={l.id} value={l.id}>{l.sourceName}</option>)}</select></div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {AVAILABLE_TAGS.map(tag => (
                <button type="button" key={tag} onClick={() => toggleFilterTag(tag)} className={`px-2 py-1 text-[10px] rounded-full border ${filterTags.includes(tag) ? TAG_COLORS[tag] : "bg-white"}`}>{tag}</button>
              ))}
              {filterTags.length > 0 && <button onClick={() => setFilterTags([])} className="text-[10px] font-bold text-rose-600">Limpar Etiquetas</button>}
            </div>
          </div>
        )}

        {filteredPieces.length === 0 ? (
          <div className="p-12 text-center text-zinc-500"><Package className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhuma peça encontrada.</p></div>
        ) : (
          <>
            <div className="md:hidden flex flex-col divide-y divide-zinc-100">
              {filteredPieces.map((piece) => (
                <div key={piece.id} className="p-4 flex flex-col gap-3 hover:bg-zinc-50 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 items-start flex-1">
                      <div className="w-16 h-16 rounded-md bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden relative flex items-center justify-center">
                        {piece.images && piece.images.length > 0 ? (
                          <Image src={piece.images[0].imageUrl} alt={piece.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-zinc-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0A244A] text-sm leading-tight line-clamp-2">{piece.name}</h3>
                        <span className="text-[11px] text-zinc-500 font-medium mt-0.5 inline-block bg-zinc-100 px-1.5 rounded">SKU: {piece.code}</span>
                      </div>
                    </div>
                    <div className="font-bold text-[#1E5AA8] text-sm shrink-0">
                      {formatCurrency(piece.purchasePrice)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                     <span className="text-xs text-zinc-600">
                        <span className="font-medium">Origem:</span> {piece.lot?.sourceName}
                     </span>
                     {piece.store && piece.tags.includes("Em consignação") && (
                        <span className="text-xs text-purple-700 flex items-center gap-1.5 font-medium bg-purple-50 px-2 py-1 rounded w-fit">
                          <Store className="w-3.5 h-3.5 shrink-0" /> {piece.store.name}
                        </span>
                     )}
                     {piece.observations && (
                        <span className="text-xs text-amber-700 flex items-center gap-1.5 font-medium bg-amber-50 px-2 py-1 rounded w-fit">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {piece.observations}
                        </span>
                     )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {piece.tags && piece.tags.length > 0 ? (
                      piece.tags.map(tag => (
                        <Badge key={tag} className={`font-normal px-2 py-0.5 text-[10px] ${TAG_COLORS[tag] || "bg-zinc-100 text-zinc-800"}`}>
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-400 italic">Sem etiquetas</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-zinc-100 mt-2">
                     <div className="flex gap-1.5">
                        <button onClick={() => handleEditClick(piece)} className="p-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-md transition-colors cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPieceToDelete(piece.id)} className="p-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-md transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Imagem</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Etiquetas</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPieces.map((piece) => (
                    <TableRow key={piece.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded bg-zinc-100 overflow-hidden relative flex items-center justify-center">
                          {piece.images && piece.images.length > 0 ? <Image src={piece.images[0].imageUrl} alt="img" fill className="object-cover" sizes="40px" /> : <ImageIcon className="w-4 h-4 text-zinc-300" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium"><span className="bg-zinc-100 rounded px-1.5 py-0.5">{piece.code}</span></TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{piece.name}</span>
                          <span className="text-[10px] text-zinc-500">Origem: {piece.lot?.sourceName}</span>
                          {piece.store && piece.tags.includes("Em consignação") && (
                            <span className="text-[10px] text-purple-700 flex items-center gap-1 font-medium bg-purple-50 px-1 py-0.5 rounded w-fit mt-0.5">
                              <Store className="w-3 h-3 shrink-0" /> Em {piece.store.name}
                            </span>
                          )}
                          {piece.observations && (
                            <span className="text-[10px] text-amber-600 flex items-center gap-1 font-medium bg-amber-50 px-1 py-0.5 rounded w-fit mt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0" /> {piece.observations}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {piece.tags.map(tag => <Badge key={tag} className={`text-[9px] px-1.5 py-0 font-normal border-transparent ${TAG_COLORS[tag]}`}>{tag}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#1E5AA8]">{formatCurrency(piece.purchasePrice)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEditClick(piece)} className="p-2 text-zinc-400 hover:bg-blue-50 hover:text-[#1E5AA8] rounded mx-1"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setPieceToDelete(piece.id)} className="p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}