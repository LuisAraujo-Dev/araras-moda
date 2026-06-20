//src/app/(dashboard)/dashboard/inventory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, PlusCircle, Zap, Tag } from "lucide-react";
import { getPiecesAction, seedTaxonomyAction, createPieceAction, getTaxonomyAction, quickAddCategory, quickAddBrand, quickAddSize, quickAddColor } from "@/app/actions/piece.actions";
import { Category, Brand, Lot, Size, Color, Piece } from "@prisma/client";

type PieceWithRelations = Piece & {
  category: Category;
  brand: Brand;
  lot: Lot;
  size: Size | null;
  color: Color | null;
};

type TaxonomyData = {
  categories: Category[];
  brands: Brand[];
  lots: Lot[];
  sizes: Size[];
  colors: Color[];
};

export default function InventoryPage() {
  const mockCompanyId = "company-placeholder-id";

  const [pieces, setPieces] = useState<PieceWithRelations[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyData>({ categories: [], brands: [], lots: [], sizes: [], colors: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [catId, setCatId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [colorId, setColorId] = useState("");

  const loadData = async () => {
    const [piecesData, taxonomyData] = await Promise.all([
      getPiecesAction(mockCompanyId),
      getTaxonomyAction(mockCompanyId)
    ]);
    setPieces(piecesData as PieceWithRelations[]);
    setTaxonomy(taxonomyData as TaxonomyData);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const [piecesData, taxonomyData] = await Promise.all([
        getPiecesAction(mockCompanyId),
        getTaxonomyAction(mockCompanyId)
      ]);
      if (isMounted) {
        setPieces(piecesData as PieceWithRelations[]);
        setTaxonomy(taxonomyData as TaxonomyData);
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const catName = taxonomy.categories.find((c: Category) => c.id === catId)?.name || "";
  const brandName = taxonomy.brands.find((b: Brand) => b.id === brandId)?.name || "";
  const sizeName = taxonomy.sizes.find((s: Size) => s.id === sizeId)?.name || "";
  const colorName = taxonomy.colors.find((c: Color) => c.id === colorId)?.name || "";
  
  const hasSelection = catId || brandId || sizeId || colorId;
  const autoNameParts = [catName, brandName, sizeName ? `Tamanho ${sizeName}` : "", colorName].filter(Boolean);
  const autoName = hasSelection ? (autoNameParts.join(" ") || "Nova Peça") : "Selecione os atributos...";

  async function handleSeed() {
    setLoading(true);
    const result = await seedTaxonomyAction(mockCompanyId);
    setLoading(false);
    if (result.error) alert(result.error);
    else {
      alert("Sucesso! O sistema gerou categorias de teste.");
      await loadData();
    }
  }

  const handleQuickAdd = async (type: 'category' | 'brand' | 'size' | 'color') => {
    const labels = { category: "Categoria", brand: "Marca", size: "Tamanho", color: "Cor" };
    const newValue = window.prompt(`Digite o nome da nova ${labels[type]}:`);
    
    if (!newValue || newValue.trim() === "") return;
    
    setLoading(true);
    let newRecord;
    if (type === 'category') newRecord = await quickAddCategory(mockCompanyId, newValue);
    if (type === 'brand') newRecord = await quickAddBrand(mockCompanyId, newValue);
    if (type === 'size') newRecord = await quickAddSize(mockCompanyId, newValue);
    if (type === 'color') newRecord = await quickAddColor(mockCompanyId, newValue);
    
    await loadData(); 
    
    if (type === 'category' && newRecord) setCatId(newRecord.id);
    if (type === 'brand' && newRecord) setBrandId(newRecord.id);
    if (type === 'size' && newRecord) setSizeId(newRecord.id);
    if (type === 'color' && newRecord) setColorId(newRecord.id);
    
    setLoading(false);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: autoName,
      categoryId: catId,
      brandId: brandId,
      sizeId: sizeId,
      colorId: colorId,
      condition: formData.get("condition") as string,
      lotId: formData.get("lotId") as string,
      purchasePrice: Number(formData.get("purchasePrice")),
    };

    const result = await createPieceAction(mockCompanyId, data);
    setLoading(false);

    if (result.success) {
      setOpen(false);
      setCatId(""); setBrandId(""); setSizeId(""); setColorId("");
      await loadData();
    } else {
      alert(result.error);
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Minha Arara</h1>
          <p className="text-[#4B4B4B] mt-1">Gerencie as peças de vestuário e acompanhe o fluxo de estados.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSeed} variant="outline" className="flex items-center gap-2 cursor-pointer border-[#F4C21A] text-[#0A244A] hover:bg-[#F4C21A] hover:text-[#0A244A] transition-colors font-medium shadow-sm" disabled={loading}>
            <Zap className="w-4 h-4" /> Carga Rápida
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={`flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium ${taxonomy.categories.length === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
              <PlusCircle className="w-4 h-4" /> Cadastrar Peça
            </DialogTrigger>
            <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#0A244A]">Cadastrar Nova Peça</DialogTitle>
                <DialogDescription className="text-[#4B4B4B]">
                  O nome e o código SKU serão gerados automaticamente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-white rounded shadow-sm"><Tag className="w-4 h-4 text-[#1E5AA8]" /></div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Nome Automático</p>
                  <p className="text-[#0A244A] font-bold text-lg">{autoName}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[#0A244A]">Categoria</Label>
                    <select value={catId} onChange={(e) => e.target.value === "NEW" ? handleQuickAdd('category') : setCatId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {taxonomy.categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Nova Categoria</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#0A244A]">Marca</Label>
                    <select value={brandId} onChange={(e) => e.target.value === "NEW" ? handleQuickAdd('brand') : setBrandId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {taxonomy.brands.map((b: Brand) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Nova Marca</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[#0A244A]">Tamanho</Label>
                    <select value={sizeId} onChange={(e) => e.target.value === "NEW" ? handleQuickAdd('size') : setSizeId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {taxonomy.sizes.map((s: Size) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Novo Tamanho</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#0A244A]">Cor</Label>
                    <select value={colorId} onChange={(e) => e.target.value === "NEW" ? handleQuickAdd('color') : setColorId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {taxonomy.colors.map((c: Color) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Nova Cor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="lotId" className="text-[#0A244A]">Lote Origem</Label>
                    <select id="lotId" name="lotId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {taxonomy.lots.map((l: Lot) => <option key={l.id} value={l.id}>{l.code}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="purchasePrice" className="text-[#0A244A]">Custo / Compra (R$)</Label>
                    <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="condition" className="text-[#0A244A]">Observações / Condição (Opcional)</Label>
                  <Input id="condition" name="condition" placeholder="Ex: Fio puxado na manga, Peça nova com etiqueta..." />
                </div>

                <Button type="submit" className="w-full mt-4 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-11" disabled={loading}>
                  {loading ? "A processar..." : "Salvar Peça na Arara"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {pieces.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Package className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhuma peça na sua Arara</h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">Clique em &apos;Carga Rápida&apos; para gerar os atributos base e começar.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieces.map((piece) => (
                <TableRow key={piece.id}>
                  <TableCell className="font-medium text-[#4B4B4B]">{piece.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#0A244A]">{piece.name}</span>
                      <span className="text-xs text-zinc-500">{piece.lot?.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-zinc-100">{piece.size?.name}</Badge>
                      <Badge variant="secondary" className="bg-zinc-100">{piece.color?.name}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-[#1E5AA8]">
                    {formatCurrency(piece.purchasePrice)}
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