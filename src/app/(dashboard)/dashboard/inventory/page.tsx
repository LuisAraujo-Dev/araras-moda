// src/app/(dashboard)/inventory/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, PlusCircle, Sparkles } from "lucide-react";
import { createPieceAction, getPiecesAction, getInventoryDependencies, seedTaxonomiesAction } from "@/app/actions/piece.actions";

// 1. Importamos as tipagens exatas do Prisma
import { Piece, Category, Brand, Size, Color, Lot } from "@prisma/client";

// 2. Criamos um tipo combinado para a Peça que inclui as suas relações
type PieceWithRelations = Piece & {
  category: Category;
  brand: Brand;
  size: Size;
  color: Color;
  lot: Lot;
};

// 3. Tipamos o nosso objeto de dependências (Taxonomia)
type InventoryDependencies = {
  lots: Lot[];
  categories: Category[];
  brands: Brand[];
  sizes: Size[];
  colors: Color[];
};

export default function InventoryPage() {
  const mockCompanyId = "company-placeholder-id";
  const mockUserId = "user-placeholder-id";

  // Substituímos os 'any' pelos tipos corretos
  const [pieces, setPieces] = useState<PieceWithRelations[]>([]);
  const [dependencies, setDependencies] = useState<InventoryDependencies>({ 
    lots: [], categories: [], brands: [], sizes: [], colors: [] 
  });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Envolvemos o loadData num useCallback para o React saber que a função é estável
  const loadData = useCallback(async () => {
    const [piecesData, depsData] = await Promise.all([
      getPiecesAction(mockCompanyId),
      getInventoryDependencies(mockCompanyId),
    ]);
    
    // Forçamos a tipagem dos dados recebidos da Action
    setPieces(piecesData as PieceWithRelations[]);
    setDependencies(depsData as InventoryDependencies);
  }, []);

  useEffect(() => {
    // Definir a função assíncrona internamente resolve o erro de "cascading renders"
    const fetchInitialData = async () => {
      await loadData();
    };
    
    fetchInitialData();
  }, [loadData]);

  async function handleSeed() {
    const res = await seedTaxonomiesAction(mockCompanyId);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      lotId: formData.get("lotId") as string,
      code: formData.get("code") as string,
      qrCode: formData.get("qrCode") as string,
      name: formData.get("name") as string,
      categoryId: formData.get("categoryId") as string,
      brandId: formData.get("brandId") as string,
      colorId: formData.get("colorId") as string,
      sizeId: formData.get("sizeId") as string,
      condition: formData.get("condition") as string,
      gender: formData.get("gender") as string,
      purchasePrice: Number(formData.get("purchasePrice")),
      estimatedSalePrice: Number(formData.get("estimatedSalePrice")),
      notes: formData.get("notes") as string,
    };

    const result = await createPieceAction(mockCompanyId, mockUserId, data);
    setLoading(false);

    if (result.success) {
      setOpen(false);
      await loadData();
    } else {
      alert(result.error);
    }
  }

  const hasDeps = dependencies.lots.length > 0 && dependencies.categories.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Estoque / Inventário</h1>
          <p className="text-zinc-500">Gerencie as peças de vestuário e acompanhe o fluxo de estados.</p>
        </div>

        <div className="flex gap-3">
          {!hasDeps && (
            <Button variant="outline" onClick={handleSeed} className="flex items-center gap-2 border-dashed">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Carga Rápida de Teste
            </Button>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger disabled={!hasDeps} className={`${buttonVariants({ variant: "default" })} flex items-center gap-2 disabled:opacity-50`}>
              <PlusCircle className="w-4 h-4" />
              Cadastrar Peça
            </DialogTrigger>
            <DialogContent className="sm:max-w-500px">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Peça</DialogTitle>
                <DialogDescription>Associe as características físicas da peça ao seu lote.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="lotId">Lote de Origem</Label>
                    <select id="lotId" name="lotId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      {dependencies.lots.map((l: Lot) => <option key={l.id} value={l.id}>{l.code}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="code">Código SKU interno</Label>
                    <Input id="code" name="code" placeholder="Ex: P-001" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="qrCode">Código de Barras / QR</Label>
                    <Input id="qrCode" name="qrCode" placeholder="Ex: QR-12345" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="name">Identificação / Nome</Label>
                    <Input id="name" name="name" placeholder="Ex: Camisa Seda Floral" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="categoryId">Categoria</Label>
                    <select id="categoryId" name="categoryId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      {dependencies.categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="brandId">Marca</Label>
                    <select id="brandId" name="brandId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      {dependencies.brands.map((b: Brand) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="colorId">Cor Principal</Label>
                    <select id="colorId" name="colorId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      {dependencies.colors.map((co: Color) => <option key={co.id} value={co.id}>{co.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sizeId">Tamanho</Label>
                    <select id="sizeId" name="sizeId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      {dependencies.sizes.map((s: Size) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="condition">Condição</Label>
                    <select id="condition" name="condition" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="NOVA">Nova com etiqueta</option>
                      <option value="EXCELENTE">Excelente estado</option>
                      <option value="BOA">Bom estado</option>
                      <option value="REGULAR">Sinais de uso</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gender">Gênero</Label>
                    <select id="gender" name="gender" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="UNISSEX">Unissex</option>
                      <option value="FEMININO">Feminino</option>
                      <option value="MASCULINO">Masculino</option>
                      <option value="INFANTIL">Infantil</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="purchasePrice">Preço de Compra (R$)</Label>
                    <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" placeholder="0.00" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="estimatedSalePrice">Preço de Venda (R$)</Label>
                    <Input id="estimatedSalePrice" name="estimatedSalePrice" type="number" step="0.01" placeholder="0.00" required />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? "Processando..." : "Salvar Peça"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {pieces.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Package className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900">Nenhuma peça no inventário</h3>
            <p className="text-sm text-zinc-500 max-w-sm mt-1">
              {!hasDeps 
                ? "Clique em 'Carga Rápida de Teste' para gerar as dependências básicas estruturais do banco." 
                : "Clique em 'Cadastrar Peça' para dar entrada no seu primeiro item de estoque."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Tam.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">P. Venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieces.map((piece) => (
                <TableRow key={piece.id}>
                  <TableCell className="font-medium text-zinc-600">{piece.code}</TableCell>
                  <TableCell className="font-medium text-zinc-900">{piece.name}</TableCell>
                  <TableCell>{piece.category.name}</TableCell>
                  <TableCell>{piece.brand.name}</TableCell>
                  <TableCell><Badge variant="secondary">{piece.size.name}</Badge></TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 capitalize">
                      {piece.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(piece.estimatedSalePrice)}
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