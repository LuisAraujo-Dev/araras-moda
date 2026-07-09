"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, PlusCircle, Tag, CheckCircle2, AlertCircle, Filter, Pencil, Trash2, Store, ArrowLeft, Globe, Eye, EyeOff, ChevronDown, Search, Check, ImageIcon, Camera, Loader2 } from "lucide-react";
import { getPiecesAction, createPieceAction, updatePieceAction, deletePieceAction, getTaxonomyAction, quickAddCategory, quickAddBrand, quickAddSize, quickAddColor, quickAddLot, quickAddStore } from "@/app/actions/piece.actions";
import { togglePieceVisibilityAction } from "@/app/actions/storefront.actions";
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
  isPublished: boolean;
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

type SelectOption = {
  id: string;
  name?: string;
  sourceName?: string;
  code?: string;
};

function SearchableSelect({ 
  value, onChange, options, placeholder, newItemLabel, onAddNew 
}: {
  value: string; onChange: (val: string) => void; options: SelectOption[]; placeholder: string; newItemLabel: string; onAddNew: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const getText = (opt: SelectOption) => {
    if (opt.name) return opt.name;
    if (opt.sourceName) return `${opt.sourceName} (${opt.code})`;
    return "";
  };
  
  const selectedItem = options.find((o) => o.id === value);
  const displayText = selectedItem ? getText(selectedItem) : placeholder;

  const filtered = options.filter((o) => {
    return getText(o).toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => {
    const textA = getText(a).toLowerCase();
    const textB = getText(b).toLowerCase();
    const s = search.toLowerCase();
    if (textA.startsWith(s) && !textB.startsWith(s)) return -1;
    if (!textA.startsWith(s) && textB.startsWith(s)) return 1;
    return 0;
  });

  return (
    <div className="relative">
      <input type="text" value={value} required tabIndex={-1} className="absolute opacity-0 w-0 h-0 pointer-events-none -z-10" onChange={() => {}} />
      <div 
        className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm flex items-center justify-between cursor-pointer focus-within:border-[#1E5AA8] focus-within:ring-1 focus-within:ring-[#1E5AA8] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
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
                <input 
                  autoFocus type="text" className="w-full h-8 pl-8 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] outline-none transition-all" 
                  placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="p-1 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-sm text-zinc-500 text-center font-medium">Nenhum resultado encontrado</div>
              ) : (
                filtered.map((opt) => (
                   <div 
                     key={opt.id} className="px-3 py-2 text-sm hover:bg-zinc-100 rounded cursor-pointer flex items-center justify-between transition-colors"
                     onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(""); }}
                   >
                     <span className="truncate pr-2">{getText(opt)}</span>
                     {value === opt.id && <Check className="w-4 h-4 text-[#1E5AA8] shrink-0" />}
                   </div>
                ))
              )}
              <div className="border-t border-zinc-100 my-1"></div>
              <div 
                className="px-3 py-2.5 text-sm font-bold text-[#1E5AA8] hover:bg-blue-50 rounded cursor-pointer flex items-center gap-2 transition-colors"
                onClick={() => { onAddNew(); setIsOpen(false); setSearch(""); }}
              >
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
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingPiece, setEditingPiece] = useState<PieceWithRelations | null>(null);
  const [pieceToDelete, setPieceToDelete] = useState<string | null>(null);

  const [catId, setCatId] = useState(""); 
  const [brandId, setBrandId] = useState("");
  const [sizeId, setSizeId] = useState(""); 
  const [colorId, setColorId] = useState("");
  const [lotId, setLotId] = useState(""); 
  const [storeId, setStoreId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // Estados para Gestão de Imagens
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quickAdd, setQuickAdd] = useState({ isOpen: false, type: "", label: "" });
  const [quickAddValue, setQuickAddValue] = useState("");

  const isConsigned = selectedTags.includes("Em consignação");
  const isAlreadySold = editingPiece?.tags.includes("Vendida");
  const isNowSold = selectedTags.includes("Vendida");
  const showSalePriceInput = !isAlreadySold && isNowSold;

  const loadData = async (cid: string) => {
    const [p, t] = await Promise.all([getPiecesAction(cid), getTaxonomyAction(cid)]);
    setPieces(p as PieceWithRelations[]); 
    setTaxonomy(t as TaxonomyData);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const status = await checkOnboardingStatusAction();
      
      if (status.success && status.companyId) {
        if (isMounted) setCompanyId(status.companyId);
        const [p, t] = await Promise.all([
          getPiecesAction(status.companyId), 
          getTaxonomyAction(status.companyId)
        ]);
        if (isMounted) {
          setPieces(p as PieceWithRelations[]);
          setTaxonomy(t as TaxonomyData);
        }
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const handleToggleVisibility = async (pieceId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    setPieces(prevPieces => 
      prevPieces.map(p => p.id === pieceId ? { ...p, isPublished: newStatus } : p)
    );

    const result = await togglePieceVisibilityAction(pieceId, newStatus);
    
    if (!result.success) {
      setPieces(prevPieces => 
        prevPieces.map(p => p.id === pieceId ? { ...p, isPublished: currentStatus } : p)
      );
      showBanner(result.error || "Erro ao atualizar a vitrine.", "error");
    } else {
      showBanner(newStatus ? "Peça publicada na vitrine!" : "Peça removida da vitrine.", "success");
    }
  };

  const showBanner = (m: string, t: "success" | "error") => {
    setBanner({ show: true, message: m, type: t }); 
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const triggerQuickAdd = (type: string, label: string) => {
    setQuickAdd({ isOpen: true, type, label });
    setQuickAddValue("");
  };

  const handleSaveQuickAdd = async () => {
    if (!quickAddValue || quickAddValue.trim() === "" || !companyId) return;
    
    setLoading(true);
    let newRecord;
    
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
    
    setLoading(false);
    setQuickAdd({ isOpen: false, type: "", label: "" });
  };

  const toggleTag = (tag: string) => {
    if (tag === "Vendida") {
      setSelectedTags(prev => prev.includes("Vendida") ? [] : ["Vendida"]);
    } else {
      setSelectedTags(prev => {
        const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
        return next.filter(t => t !== "Vendida");
      });
    }
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (piece: PieceWithRelations) => {
    setEditingPiece(piece); 
    setCatId(piece.categoryId); 
    setBrandId(piece.brandId);
    setSizeId(piece.sizeId || ""); 
    setColorId(piece.colorId || ""); 
    setLotId(piece.lotId);
    setStoreId(piece.storeId || ""); 
    setSelectedTags(piece.tags || []); 
    setImagePreview(piece.images && piece.images.length > 0 ? piece.images[0].imageUrl : null);
    setImageFile(null);
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setEditingPiece(null);
      setQuickAdd({ isOpen: false, type: "", label: "" });
      setCatId(""); setBrandId(""); setSizeId(""); setColorId(""); setLotId(""); setStoreId(""); setSelectedTags([]);
      setImagePreview(null);
      setImageFile(null);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); 
    if (!companyId) return;

    // 1. CAPTURA DOS DADOS DO FORMULÁRIO (SÍNCRONO)
    // Extraímos os dados de texto *antes* de iniciar o processo assíncrono da imagem.
    // Assim prevenimos o "crash" interno do React que congelava a aplicação.
    const formData = new FormData(event.currentTarget);

    setLoading(true);
    let finalImageUrl = imagePreview; // Mantém a URL existente se for edição e não mudar foto

    // 2. ENVIO DA IMAGEM PARA A VERCEL BLOB
    if (imageFile) {
      setIsUploading(true);

      try {
        // Ajuste: A Vercel espera o nome do ficheiro na URL e o ficheiro bruto no "body"
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(imageFile.name)}`, { 
          method: "POST", 
          body: imageFile 
        });
        
        if (res.ok) {
          const blob = await res.json();
          finalImageUrl = blob.url; // URL pública da imagem recém guardada
        } else {
          console.error("Erro no response do upload da imagem:", await res.text());
          showBanner("Aviso: Falha ao guardar a foto, mas a peça será cadastrada.", "error");
        }
      } catch (e) {
        console.error("Erro de conexão no upload:", e);
        showBanner("Erro de conexão na fotografia.", "error");
      }
      setIsUploading(false);
    }

    // 3. SALVAR OS DADOS NO BANCO DE DADOS
    const catName = taxonomy.categories.find(c => c.id === catId)?.name || "";
    const brandName = taxonomy.brands.find(b => b.id === brandId)?.name || "";
    const sizeName = taxonomy.sizes.find(s => s.id === sizeId)?.name || "";
    const colorName = taxonomy.colors.find(c => c.id === colorId)?.name || "";
    const autoName = [catName, brandName, sizeName ? `Tamanho ${sizeName}` : "", colorName].filter(Boolean).join(" ") || "Nova Peça";

    // Garante que só guarda URLs válidas (evita guardar as strings blob: locais do navegador)
    const safeImageUrl = finalImageUrl && !finalImageUrl.startsWith('blob:') ? finalImageUrl : undefined;

    const data = {
      name: autoName, 
      categoryId: catId, 
      brandId: brandId, 
      sizeId: sizeId, 
      colorId: colorId,
      tags: selectedTags, 
      observations: formData.get("observations") as string, 
      lotId: lotId,
      storeId: isConsigned ? (storeId || null) : null, 
      purchasePrice: Number(formData.get("purchasePrice")),
      registerSale: showSalePriceInput, 
      salePrice: showSalePriceInput ? Number(formData.get("salePrice")) : undefined,
      imageUrl: safeImageUrl
    };

    const result = editingPiece 
      ? await updatePieceAction(editingPiece.id, companyId, data) 
      : await createPieceAction(companyId, data);
      
    setLoading(false); // Agora este código corre sempre, destrancando o ecrã!

    if (result.success) {
      handleCloseModal(false);
      showBanner(editingPiece ? "Peça atualizada!" : "Peça guardada com foto!", "success");
      await loadData(companyId);
    } else {
      showBanner(result.error || "Erro ao salvar na base de dados.", "error");
    }
  }

  async function confirmDelete() {
    if (!pieceToDelete || !companyId) return;
    setLoading(true); 
    await deletePieceAction(pieceToDelete, companyId); 
    setLoading(false);
    showBanner("Excluída com sucesso!", "success"); 
    setPieceToDelete(null); 
    await loadData(companyId);
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const filteredPieces = pieces.filter(piece => {
    if (filterTags.length === 0) return true;
    return filterTags.some(tag => piece.tags.includes(tag));
  });

  if (!companyId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center text-zinc-500">
          <Package className="w-8 h-8 animate-pulse mb-2 text-[#1E5AA8]" />
          <p>A carregar o seu estoque privado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-6">
      {banner.show && (
        <div className={`fixed top-6 right-6 z-100 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl transition-all min-w-80 ${banner.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Minha Arara</h1>
          <p className="text-[#4B4B4B] mt-1 text-sm md:text-base">Gerencie peças e controle o seu estoque.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Cadastrar Peça
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
              
              {quickAdd.isOpen ? (
                <div className="space-y-6 py-2">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setQuickAdd({ isOpen: false, type: "", label: "" })} className="p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                      <ArrowLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                    <div>
                      <DialogTitle className="text-[#0A244A]">Novo Cadastro</DialogTitle>
                      <DialogDescription>Adicionar {quickAdd.label.toLowerCase()} ao sistema.</DialogDescription>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[#0A244A]">Nome da {quickAdd.label}</Label>
                    <Input autoFocus value={quickAddValue} onChange={(e) => setQuickAddValue(e.target.value)} placeholder={`Ex: ${quickAdd.label === 'Origem' ? 'Brechó da Maria' : 'Azul Marinho'}`} />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveQuickAdd} className="flex-1 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white" disabled={loading || !quickAddValue}>
                      {loading ? "A processar..." : "Salvar e Voltar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-[#0A244A]">{editingPiece ? "Editar Peça" : "Cadastrar Peça"}</DialogTitle>
                    <DialogDescription className="text-[#4B4B4B] text-xs sm:text-sm">
                      Pode tirar a foto no momento do cadastro e gerir os dados da peça.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    
                    {/* Botão Quadrado Gigante de Upload */}
                    <div className="flex justify-center mb-6">
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 hover:border-[#1E5AA8] transition-all overflow-hidden relative group shadow-sm"
                      >
                        {imagePreview ? (
                          <>
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="160px" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                          </>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-zinc-400 mb-2 group-hover:text-[#1E5AA8] transition-colors" />
                            <span className="text-xs font-medium text-zinc-500 group-hover:text-[#1E5AA8] transition-colors text-center px-2">
                              Tirar Foto<br/>(ou Galeria)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Categoria</Label>
                        <SearchableSelect
                          value={catId} onChange={setCatId} options={taxonomy.categories}
                          placeholder="Selecione..." newItemLabel="Cadastrar Nova Categoria" onAddNew={() => triggerQuickAdd('category', 'Categoria')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Marca</Label>
                        <SearchableSelect
                          value={brandId} onChange={setBrandId} options={taxonomy.brands}
                          placeholder="Selecione..." newItemLabel="Cadastrar Nova Marca" onAddNew={() => triggerQuickAdd('brand', 'Marca')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Tamanho</Label>
                        <SearchableSelect
                          value={sizeId} onChange={setSizeId} options={taxonomy.sizes}
                          placeholder="Selecione..." newItemLabel="Cadastrar Novo Tamanho" onAddNew={() => triggerQuickAdd('size', 'Tamanho')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Cor</Label>
                        <SearchableSelect
                          value={colorId} onChange={setColorId} options={taxonomy.colors}
                          placeholder="Selecione..." newItemLabel="Cadastrar Nova Cor" onAddNew={() => triggerQuickAdd('color', 'Cor')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Origem / Lote</Label>
                        <SearchableSelect
                          value={lotId} onChange={setLotId} options={taxonomy.lots}
                          placeholder="Selecione..." newItemLabel="Cadastrar Nova Origem" onAddNew={() => triggerQuickAdd('lot', 'Origem')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="purchasePrice" className="text-[#0A244A]">Custo / Compra (R$)</Label>
                        <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" defaultValue={editingPiece?.purchasePrice || ""} required className="h-10" />
                      </div>
                    </div>

                    <div className="space-y-3 bg-zinc-50/50 border border-zinc-200 rounded-lg p-4">
                      <Label className="text-[#0A244A] flex items-center gap-2"><Tag className="w-4 h-4" /> Etiquetas</Label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map(tag => (
                          <button type="button" key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${selectedTags.includes(tag) ? TAG_COLORS[tag] : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100"}`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                      
                      {isConsigned && (
                        <div className="pt-4 border-t border-zinc-200 mt-4">
                          <Label className="text-purple-900 mb-2 block">Parceiro (Consignação)</Label>
                          <SearchableSelect
                            value={storeId} onChange={setStoreId} options={taxonomy.stores}
                            placeholder="Onde está a peça?" newItemLabel="Cadastrar Novo Parceiro" onAddNew={() => triggerQuickAdd('store', 'Parceiro')}
                          />
                        </div>
                      )}

                      {showSalePriceInput && (
                        <div className="pt-4 border-t border-zinc-200 mt-4 animate-in slide-in-from-top-2">
                          <div className="bg-lime-50 border border-lime-200 p-4 rounded-md">
                            <Label htmlFor="salePrice" className="text-lime-900 font-bold mb-2 block">Valor Efetivo da Venda (R$)</Label>
                            <Input id="salePrice" name="salePrice" type="number" step="0.01" min="0" required={showSalePriceInput} placeholder="Lançamento automático..." className="bg-white border-lime-300 focus-visible:ring-lime-500 h-10" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="observations" className="text-[#0A244A]">Observações</Label>
                      <Input id="observations" name="observations" defaultValue={editingPiece?.observations || ""} placeholder="Ex: Fio puxado na manga direita..." className="h-10" />
                    </div>

                    <Button type="submit" className="w-full mt-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-12 text-base shadow-sm font-medium flex items-center gap-2 justify-center" disabled={loading || isUploading}>
                      {(loading || isUploading) && <Loader2 className="w-5 h-5 animate-spin" />}
                      {isUploading ? "A enviar foto..." : loading ? "A guardar..." : "Salvar Alterações"}
                    </Button>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={!!pieceToDelete} onOpenChange={(val) => !val && setPieceToDelete(null)}>
            <DialogContent className="w-[90vw] sm:max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-zinc-600 mt-3 text-sm md:text-base">
                  Tem certeza que deseja excluir esta peça da sua Arara? Esta ação não poderá ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 cursor-pointer h-11" onClick={() => setPieceToDelete(null)} disabled={loading}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer h-11" onClick={confirmDelete} disabled={loading}>
                  {loading ? "A processar..." : "Sim, Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {pieces.length > 0 && (
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col items-start gap-3">
            <span className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtrar por etiquetas:
            </span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleFilterTag(tag)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                    filterTags.includes(tag) 
                      ? TAG_COLORS[tag] 
                      : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100 opacity-70 hover:opacity-100"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {filterTags.length > 0 && (
                <button onClick={() => setFilterTags([])} className="px-3 py-1 text-xs font-medium text-zinc-500 hover:text-[#0A244A] cursor-pointer">
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        )}

        {filteredPieces.length === 0 ? (
          <div className="p-12 md:p-16 text-center flex flex-col items-center justify-center">
            <Package className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">
              {pieces.length === 0 ? "Nenhuma peça na sua Arara" : "Nenhuma peça encontrada"}
            </h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              {pieces.length === 0 ? "Clique em 'Cadastrar Peça' para adicionar o seu primeiro item." : "Tente remover alguns filtros para ver mais resultados."}
            </p>
          </div>
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

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 mt-2">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border ${piece.isPublished ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-zinc-50 border-zinc-200 text-zinc-500"}`}>
                        <Globe className={`w-3.5 h-3.5 ${piece.isPublished ? "text-emerald-500" : "text-zinc-400"}`} />
                        {piece.isPublished ? "Na Vitrine" : "Offline"}
                     </span>

                     <div className="flex gap-1.5">
                        <button
                          onClick={() => handleToggleVisibility(piece.id, piece.isPublished)}
                          className={`p-2 rounded-md transition-colors cursor-pointer border ${piece.isPublished ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-zinc-200 text-zinc-500 bg-zinc-50"}`}
                        >
                          {piece.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
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
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-24 font-semibold">Imagem</TableHead>
                    <TableHead className="w-24 font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold min-w-50">Produto</TableHead>
                    <TableHead className="font-semibold min-w-37.5">Etiquetas</TableHead>
                    <TableHead className="text-right font-semibold">Custo</TableHead>
                    <TableHead className="text-center font-semibold">Vitrine</TableHead>
                    <TableHead className="text-right w-36 font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPieces.map((piece) => (
                    <TableRow key={piece.id} className="hover:bg-zinc-50/80 transition-colors">
                      <TableCell>
                        <div className="w-12 h-12 rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden relative flex items-center justify-center">
                          {piece.images && piece.images.length > 0 ? (
                            <Image 
                              src={piece.images[0].imageUrl} alt={piece.name} fill className="object-cover hover:scale-110 transition-transform cursor-pointer" sizes="48px"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-zinc-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-[#4B4B4B] text-xs">
                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded">{piece.code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[#0A244A] line-clamp-1">{piece.name}</span>
                          <span className="text-xs text-zinc-500 truncate max-w-62.5">Origem: {piece.lot?.sourceName}</span>
                          {piece.observations && (
                            <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0" /> {piece.observations}
                            </span>
                          )}
                          {piece.store && piece.tags.includes("Em consignação") && (
                            <span className="text-[11px] text-purple-700 flex items-center gap-1 font-medium bg-purple-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                              <Store className="w-3 h-3 shrink-0" /> Em {piece.store.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-50">
                          {piece.tags && piece.tags.length > 0 ? (
                            piece.tags.map(tag => (
                              <Badge key={tag} className={`font-normal px-2 py-0.5 text-[10px] border-transparent ${TAG_COLORS[tag] || "bg-zinc-100 text-zinc-800"}`}>
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-400 italic">Sem etiquetas</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-[#1E5AA8] text-right">
                        {formatCurrency(piece.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border shadow-sm ${piece.isPublished ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-zinc-200 text-zinc-500"}`}>
                          <Globe className={`w-3.5 h-3.5 ${piece.isPublished ? "text-emerald-500" : "text-zinc-400"}`} />
                          {piece.isPublished ? "Online" : "Offline"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleToggleVisibility(piece.id, piece.isPublished)} 
                            className={`p-2 rounded-md transition-all cursor-pointer border ${piece.isPublished ? "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "border-transparent text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"}`} 
                            title={piece.isPublished ? "Remover da Vitrine" : "Publicar na Vitrine"}
                          >
                            {piece.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleEditClick(piece)} className="p-2 text-zinc-400 hover:text-[#1E5AA8] hover:bg-blue-50 rounded-md transition-all cursor-pointer" title="Editar Peça">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setPieceToDelete(piece.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer" title="Excluir Peça">
                            <Trash2 className="w-4 h-4" />
                          </button>
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