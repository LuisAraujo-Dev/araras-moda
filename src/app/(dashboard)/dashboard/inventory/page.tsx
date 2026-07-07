"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, PlusCircle, Tag, CheckCircle2, AlertCircle, Filter, Pencil, Trash2, Store, ArrowLeft, Globe, Eye, EyeOff } from "lucide-react";
import { getPiecesAction, createPieceAction, updatePieceAction, deletePieceAction, getTaxonomyAction, quickAddCategory, quickAddBrand, quickAddSize, quickAddColor, quickAddLot, quickAddStore } from "@/app/actions/piece.actions";
import { togglePieceVisibilityAction } from "@/app/actions/storefront.actions";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";
import { Category, Brand, Lot, Size, Color, Piece, Store as StoreModel } from "@prisma/client";

type PieceWithRelations = Piece & {
  category: Category; 
  brand: Brand; 
  lot: Lot; 
  size: Size | null; 
  color: Color | null; 
  store: StoreModel | null;
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

export default function InventoryPage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [pieces, setPieces] = useState<PieceWithRelations[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyData>({ categories: [], brands: [], lots: [], sizes: [], colors: [], stores: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleEditClick = (piece: PieceWithRelations) => {
    setEditingPiece(piece); 
    setCatId(piece.categoryId); 
    setBrandId(piece.brandId);
    setSizeId(piece.sizeId || ""); 
    setColorId(piece.colorId || ""); 
    setLotId(piece.lotId);
    setStoreId(piece.storeId || ""); 
    setSelectedTags(piece.tags || []); 
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setEditingPiece(null);
      setQuickAdd({ isOpen: false, type: "", label: "" });
      setCatId(""); setBrandId(""); setSizeId(""); setColorId(""); setLotId(""); setStoreId(""); setSelectedTags([]);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); 
    if (!companyId) return;

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    const catName = taxonomy.categories.find(c => c.id === catId)?.name || "";
    const brandName = taxonomy.brands.find(b => b.id === brandId)?.name || "";
    const sizeName = taxonomy.sizes.find(s => s.id === sizeId)?.name || "";
    const colorName = taxonomy.colors.find(c => c.id === colorId)?.name || "";
    const autoName = [catName, brandName, sizeName ? `Tamanho ${sizeName}` : "", colorName].filter(Boolean).join(" ") || "Nova Peça";

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
      salePrice: showSalePriceInput ? Number(formData.get("salePrice")) : undefined
    };

    const result = editingPiece 
      ? await updatePieceAction(editingPiece.id, companyId, data) 
      : await createPieceAction(companyId, data);
      
    setLoading(false);

    if (result.success) {
      handleCloseModal(false);
      showBanner(editingPiece ? "Peça atualizada!" : "Peça guardada!", "success");
      await loadData(companyId);
    } else {
      showBanner(result.error || "Erro", "error");
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
    <div className="space-y-8 relative">
      {banner.show && (
        <div className={`fixed top-6 right-6 z-100 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl transition-all min-w-80 ${banner.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Minha Arara</h1>
          <p className="text-[#4B4B4B] mt-1">Gerencie peças e dispare lançamentos no financeiro ao marcar como Vendida.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Cadastrar Peça
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              
              {quickAdd.isOpen ? (
                <div className="space-y-6 py-4">
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
                    <DialogDescription className="text-[#4B4B4B]">
                      O nome e o código SKU são gerados automaticamente.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Categoria</Label>
                        <select value={catId} onChange={(e) => e.target.value === "NEW" ? triggerQuickAdd('category', 'Categoria') : setCatId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                          <option value="">Selecione...</option>
                          {taxonomy.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Nova Categoria</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Marca</Label>
                        <select value={brandId} onChange={(e) => e.target.value === "NEW" ? triggerQuickAdd('brand', 'Marca') : setBrandId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                          <option value="">Selecione...</option>
                          {taxonomy.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Nova Marca</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Tamanho</Label>
                        <select value={sizeId} onChange={(e) => e.target.value === "NEW" ? triggerQuickAdd('size', 'Tamanho') : setSizeId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                          <option value="">Selecione...</option>
                          {taxonomy.sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Novo Tamanho</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Cor</Label>
                        <select value={colorId} onChange={(e) => e.target.value === "NEW" ? triggerQuickAdd('color', 'Cor') : setColorId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                          <option value="">Selecione...</option>
                          {taxonomy.colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Nova Cor</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[#0A244A]">Origem / Lote</Label>
                        <select value={lotId} onChange={(e) => e.target.value === "NEW" ? triggerQuickAdd('lot', 'Origem') : setLotId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                          <option value="">Selecione...</option>
                          {taxonomy.lots.map(l => <option key={l.id} value={l.id}>{l.sourceName} ({l.code})</option>)}
                          <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Nova Origem</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="purchasePrice" className="text-[#0A244A]">Custo / Compra (R$)</Label>
                        <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" defaultValue={editingPiece?.purchasePrice || ""} required />
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
                          <select value={storeId} onChange={(e) => e.target.value === "NEW" ? triggerQuickAdd('store', 'Parceiro') : setStoreId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-purple-200 bg-purple-50 text-sm" required={isConsigned}>
                            <option value="">Onde está a peça?</option>
                            {taxonomy.stores.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                            <option value="NEW" className="font-bold text-purple-700">+ Cadastrar Novo Parceiro</option>
                          </select>
                        </div>
                      )}

                      {showSalePriceInput && (
                        <div className="pt-4 border-t border-zinc-200 mt-4 animate-in slide-in-from-top-2">
                          <div className="bg-lime-50 border border-lime-200 p-4 rounded-md">
                            <Label htmlFor="salePrice" className="text-lime-900 font-bold mb-2 block">Valor Efetivo da Venda (R$)</Label>
                            <Input id="salePrice" name="salePrice" type="number" step="0.01" min="0" required={showSalePriceInput} placeholder="Será lançado automaticamente nas Receitas..." className="bg-white border-lime-300 focus-visible:ring-lime-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="observations" className="text-[#0A244A]">Observações</Label>
                      <Input id="observations" name="observations" defaultValue={editingPiece?.observations || ""} placeholder="Ex: Fio puxado na manga direita..." />
                    </div>

                    <Button type="submit" className="w-full mt-4 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-11 text-base shadow-sm" disabled={loading}>
                      {loading ? "A processar..." : "Salvar Alterações"}
                    </Button>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={!!pieceToDelete} onOpenChange={(val) => !val && setPieceToDelete(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-zinc-600 mt-3 text-base">
                  Tem certeza que deseja excluir esta peça da sua Arara? Esta ação não poderá ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setPieceToDelete(null)} disabled={loading}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer" onClick={confirmDelete} disabled={loading}>
                  {loading ? "A processar..." : "Sim, Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {pieces.length > 0 && (
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtrar por:
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
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <Package className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">
              {pieces.length === 0 ? "Nenhuma peça na sua Arara" : "Nenhuma peça encontrada com estas etiquetas"}
            </h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              {pieces.length === 0 ? "Clique em 'Cadastrar Peça' para adicionar a sua primeira peça e começar." : "Tente remover alguns filtros para ver mais resultados."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-center">Vitrine</TableHead>
                <TableHead className="text-right w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPieces.map((piece) => (
                <TableRow key={piece.id}>
                  <TableCell className="font-medium text-[#4B4B4B] text-xs">{piece.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#0A244A]">{piece.name}</span>
                      <span className="text-xs text-zinc-500 truncate w-64">
                        Origem: {piece.lot?.sourceName}
                      </span>
                      {piece.observations && (
                        <span className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {piece.observations}
                        </span>
                      )}
                      {piece.store && piece.tags.includes("Em consignação") && (
                        <span className="text-xs text-purple-700 mt-0.5 flex items-center gap-1 font-medium">
                          <Store className="w-3 h-3" /> Em {piece.store.name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {piece.tags && piece.tags.length > 0 ? (
                        piece.tags.map(tag => (
                          <Badge key={tag} className={`font-normal px-2 py-0.5 text-[10px] ${TAG_COLORS[tag] || "bg-zinc-100 text-zinc-800"}`}>
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Sem etiquetas</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-[#1E5AA8] text-right">
                    {formatCurrency(piece.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${piece.isPublished ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-zinc-50 border-zinc-200 text-zinc-500"}`}>
                      <Globe className={`w-3 h-3 ${piece.isPublished ? "text-emerald-500" : "text-zinc-400"}`} />
                      {piece.isPublished ? "Online" : "Offline"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleToggleVisibility(piece.id, piece.isPublished)} 
                        className={`p-2 rounded-md transition-colors cursor-pointer ${piece.isPublished ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100 hover:text-emerald-600"}`} 
                        title={piece.isPublished ? "Remover da Vitrine" : "Publicar na Vitrine"}
                      >
                        {piece.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleEditClick(piece)} className="p-2 text-zinc-400 hover:text-[#1E5AA8] hover:bg-blue-50 rounded-md transition-colors cursor-pointer" title="Editar Peça">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPieceToDelete(piece.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer" title="Excluir Peça">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}