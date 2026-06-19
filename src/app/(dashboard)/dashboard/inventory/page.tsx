//src/app/(dashboard)/dashboard/inventory/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, PlusCircle, Zap } from "lucide-react";
import { getPiecesAction, seedTaxonomyAction, createPieceAction, getTaxonomyAction } from "@/app/actions/piece.actions";
import { Piece, Category, Brand, Lot, PieceStatus } from "@prisma/client";

// Tipagens estritas para substituir o "any"
type PieceWithRelations = Piece & {
  category: Category;
  brand: Brand;
  lot: Lot;
};

type TaxonomyData = {
  categories: Category[];
  brands: Brand[];
  lots: Lot[];
};

export default function InventoryPage() {
  const mockCompanyId = "company-placeholder-id";

  const [pieces, setPieces] = useState<PieceWithRelations[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyData>({ categories: [], brands: [], lots: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [piecesData, taxonomyData] = await Promise.all([
      getPiecesAction(mockCompanyId),
      getTaxonomyAction(mockCompanyId)
    ]);
    setPieces(piecesData as PieceWithRelations[]);
    setTaxonomy(taxonomyData as TaxonomyData);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      await loadData();
    };
    fetchInitialData();
  }, [loadData]);

  async function handleSeed() {
    setLoading(true);
    const result = await seedTaxonomyAction(mockCompanyId);
    setLoading(false);
    
    if (result.error) {
      alert(result.error);
    } else {
      alert("Sucesso! O sistema gerou categorias de teste. O botão de cadastro foi desbloqueado.");
      await loadData();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      categoryId: formData.get("categoryId") as string,
      brandId: formData.get("brandId") as string,
      lotId: formData.get("lotId") as string,
      purchasePrice: Number(formData.get("purchasePrice")),
      estimatedSalePrice: Number(formData.get("estimatedSalePrice")),
      status: PieceStatus.ESTOQUE
    };

    const result = await createPieceAction(mockCompanyId, data);
    setLoading(false);

    if (result.success) {
      setOpen(false);
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
          <Button
            onClick={handleSeed}
            variant="outline"
            className="flex items-center gap-2 cursor-pointer border-[#F4C21A] text-[#0A244A] hover:bg-[#F4C21A] hover:text-[#0A244A] transition-colors font-medium shadow-sm"
            disabled={loading}
          >
            <Zap className="w-4 h-4" />
            Carga Rápida de Teste
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            {/* O asChild foi removido e a classe do botão foi aplicada diretamente no DialogTrigger para evitar conflitos de tag button dentro de button */}
            <DialogTrigger 
              className={`flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium ${taxonomy.categories.length === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <PlusCircle className="w-4 h-4" />
              Cadastrar Peça
            </DialogTrigger>
            <DialogContent className="sm:max-w-125">
              <DialogHeader>
                <DialogTitle className="text-[#0A244A]">Cadastrar Nova Peça</DialogTitle>
                <DialogDescription className="text-[#4B4B4B]">
                  Preencha os detalhes da peça para adicioná-la à sua Arara.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="code" className="text-[#0A244A]">SKU / Código</Label>
                    <Input id="code" name="code" placeholder="Ex: CAM-001" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-[#0A244A]">Nome da Peça</Label>
                    <Input id="name" name="name" placeholder="Ex: Camiseta Vintage" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="categoryId" className="text-[#0A244A]">Categoria</Label>
                    <select id="categoryId" name="categoryId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {taxonomy.categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="brandId" className="text-[#0A244A]">Marca</Label>
                    <select id="brandId" name="brandId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {taxonomy.brands.map((b: Brand) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lotId" className="text-[#0A244A]">Lote Origem</Label>
                    <select id="lotId" name="lotId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {taxonomy.lots.map((l: Lot) => <option key={l.id} value={l.id}>{l.code}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="purchasePrice" className="text-[#0A244A]">Custo (R$)</Label>
                    <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="estimatedSalePrice" className="text-[#0A244A]">Preço Venda (R$)</Label>
                    <Input id="estimatedSalePrice" name="estimatedSalePrice" type="number" step="0.01" min="0" required />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white" disabled={loading}>
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
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              Clique em &apos;Carga Rápida de Teste&apos; para gerar as categorias base e desbloquear o cadastro.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Custo / Venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieces.map((piece) => (
                <TableRow key={piece.id}>
                  <TableCell className="font-medium text-[#4B4B4B]">{piece.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#0A244A]">{piece.name}</span>
                      <span className="text-xs text-[#4B4B4B]">{piece.brand.name} • {piece.category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[#4B4B4B] border-zinc-200">{piece.lot.code}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                      {piece.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#4B4B4B] line-through">{formatCurrency(piece.purchasePrice)}</span>
                      <span className="font-medium text-[#1E5AA8]">{formatCurrency(piece.estimatedSalePrice)}</span>
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