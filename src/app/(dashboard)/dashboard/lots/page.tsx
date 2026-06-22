// src/app/(dashboard)/dashboard/lots/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, PlusCircle, CheckCircle2, AlertCircle, Pencil, Trash2, MapPin } from "lucide-react";
import { getLotsAction, createLotAction, updateLotAction, deleteLotAction } from "@/app/actions/lot.actions";
import { Lot, SourceType } from "@prisma/client";

type LotWithCount = Lot & {
  _count: {
    pieces: number;
  };
};

const SOURCE_TYPES = Object.values(SourceType);

export default function LotsPage() {
  const mockCompanyId = "company-placeholder-id";

  const [lots, setLots] = useState<LotWithCount[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingLot, setEditingPiece] = useState<LotWithCount | null>(null);
  const [lotToDelete, setLotToDelete] = useState<string | null>(null);

  const loadData = async () => {
    const data = await getLotsAction(mockCompanyId);
    setLots(data as LotWithCount[]);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const data = await getLotsAction(mockCompanyId);
      if (isMounted) setLots(data as LotWithCount[]);
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleEditClick = (lot: LotWithCount) => {
    setEditingPiece(lot);
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) setEditingPiece(null);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const dateValue = formData.get("purchaseDate") as string;
    
    const data = {
      code: formData.get("code") as string,
      purchaseDate: dateValue ? new Date(dateValue) : new Date(),
      sourceName: formData.get("sourceName") as string,
      sourceType: formData.get("sourceType") as SourceType,
      totalCost: Number(formData.get("totalCost")),
      quantity: Number(formData.get("quantity")),
      notes: formData.get("notes") as string,
    };

    let result;
    if (editingLot) {
      result = await updateLotAction(editingLot.id, mockCompanyId, data);
    } else {
      result = await createLotAction(mockCompanyId, data);
    }
    
    setLoading(false);

    if (result.success) {
      handleCloseModal(false);
      showBanner(editingLot ? "Lote atualizado com sucesso!" : "Lote cadastrado com sucesso!", "success");
      await loadData();
    } else {
      showBanner(result.error || "Erro ao guardar o lote.", "error");
    }
  }

  async function confirmDelete() {
    if (!lotToDelete) return;
    setLoading(true);
    const result = await deleteLotAction(lotToDelete, mockCompanyId);
    setLoading(false);
    
    if (result.success) {
      showBanner("Lote excluído com sucesso!", "success");
      setLotToDelete(null);
      await loadData();
    } else {
      showBanner(result.error || "Erro ao excluir.", "error");
    }
    setLotToDelete(null);
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const formatDate = (date: Date) => 
    new Intl.DateTimeFormat("pt-BR").format(new Date(date));

  return (
    <div className="space-y-8 relative">
      {banner.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl transition-all min-w-80 ${banner.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Lotes de Compra</h1>
          <p className="text-[#4B4B4B] mt-1">Gira os fardos, sacolas e garimpos adquiridos para o estoque.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Cadastrar Lote
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#0A244A]">{editingLot ? "Editar Lote" : "Cadastrar Novo Lote"}</DialogTitle>
                <DialogDescription className="text-[#4B4B4B]">
                  Preencha os dados do garimpo, bazar ou fornecedor onde as peças foram compradas.
                </DialogDescription>
              </DialogHeader>

              <form key={editingLot?.id || "new"} onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="sourceName" className="text-[#0A244A]">Fornecedor / Local do Garimpo</Label>
                    <Input id="sourceName" name="sourceName" placeholder="Ex: Bazar Beneficente do Centro" defaultValue={editingLot?.sourceName || ""} required autoFocus />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sourceType" className="text-[#0A244A]">Tipo de Fornecedor</Label>
                    <select id="sourceType" name="sourceType" defaultValue={editingLot?.sourceType || ""} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="">Selecione...</option>
                      {SOURCE_TYPES.map(type => (
                        <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="code" className="text-[#0A244A]">Código / NF (Opcional)</Label>
                    <Input id="code" name="code" placeholder="Ex: BAZ-001 (Gerado caso vazio)" defaultValue={editingLot?.code || ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="purchaseDate" className="text-[#0A244A]">Data da Compra</Label>
                    <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={editingLot ? new Date(editingLot.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="quantity" className="text-[#0A244A]">Quantidade Estimada de Peças</Label>
                    <Input id="quantity" name="quantity" type="number" min="1" defaultValue={editingLot?.quantity || ""} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="totalCost" className="text-[#0A244A]">Custo Total do Lote (R$)</Label>
                    <Input id="totalCost" name="totalCost" type="number" step="0.01" min="0" defaultValue={editingLot?.totalCost || ""} required />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-[#0A244A]">Observações (Opcional)</Label>
                  <Input id="notes" name="notes" placeholder="Ex: Roupas de inverno em excelente estado..." defaultValue={editingLot?.notes || ""} />
                </div>

                <Button type="submit" className="w-full mt-4 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-11 text-base shadow-sm" disabled={loading}>
                  {loading ? "A processar..." : (editingLot ? "Salvar Alterações" : "Guardar Lote")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!lotToDelete} onOpenChange={(val) => !val && setLotToDelete(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-zinc-600 mt-3 text-base">
                  Tem certeza que deseja excluir este lote? Se existirem peças vinculadas a ele no estoque, a exclusão será bloqueada para evitar quebras.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setLotToDelete(null)} disabled={loading}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer" onClick={confirmDelete} disabled={loading}>
                  {loading ? "A processar..." : "Sim, Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {lots.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <Layers className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhum lote cadastrado</h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              Comece cadastrando garimpos, bazares ou fardos fechados comprados para a loja.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Código</TableHead>
                <TableHead>Fornecedor / Garimpo</TableHead>
                <TableHead>Data Compra</TableHead>
                <TableHead>Cadastro de Peças</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium text-[#4B4B4B] text-xs">{lot.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#0A244A]">{lot.sourceName}</span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {lot.sourceType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#4B4B4B] text-sm">
                    {formatDate(lot.purchaseDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-40">
                      <span className="text-xs font-medium text-[#4B4B4B] mb-1">
                        {lot._count.pieces} cadastradas (de {lot.quantity})
                      </span>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1E5AA8] rounded-full" 
                          style={{ width: `${Math.min(100, (lot._count.pieces / lot.quantity) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-[#1E5AA8] text-right">
                    {formatCurrency(lot.totalCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEditClick(lot)} className="p-2 text-zinc-400 hover:text-[#1E5AA8] hover:bg-blue-50 rounded-md transition-colors cursor-pointer" title="Editar Lote">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setLotToDelete(lot.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer" title="Excluir Lote">
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