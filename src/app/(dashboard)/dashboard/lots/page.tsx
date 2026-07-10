"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, PlusCircle, CheckCircle2, AlertCircle, Pencil, Trash2, MapPin, Loader2, Calendar, Package } from "lucide-react";
import { getLotsAction, createLotAction, updateLotAction, deleteLotAction } from "@/app/actions/lot.actions";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";
import { Lot, SourceType } from "@prisma/client";

const SOURCE_TYPES = Object.values(SourceType);

export default function AcquisitionsPage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [lots, setLots] = useState<Lot[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [lotToDelete, setLotToDelete] = useState<string | null>(null);

  const loadData = async (cid: string) => {
    const data = await getLotsAction(cid);
    setLots(data as Lot[]);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const status = await checkOnboardingStatusAction();

      if (status.success && status.companyId) {
        if (isMounted) setCompanyId(status.companyId);
        const data = await getLotsAction(status.companyId);
        if (isMounted) setLots(data as Lot[]);
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleEditClick = (lot: Lot) => {
    setEditingLot(lot);
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) setEditingLot(null);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) return;

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
      result = await updateLotAction(editingLot.id, companyId, data);
    } else {
      result = await createLotAction(companyId, data);
    }

    setLoading(false);

    if (result.success) {
      handleCloseModal(false);
      showBanner(editingLot ? "Aquisição atualizada com sucesso!" : "Aquisição cadastrada com sucesso!", "success");
      await loadData(companyId);
    } else {
      showBanner(result.error || "Erro ao guardar a aquisição.", "error");
    }
  }

  async function confirmDelete() {
    if (!lotToDelete || !companyId) return;
    setLoading(true);
    const result = await deleteLotAction(lotToDelete, companyId);
    setLoading(false);

    if (result.success) {
      showBanner("Aquisição excluída com sucesso!", "success");
      setLotToDelete(null);
      await loadData(companyId);
    } else {
      showBanner(result.error || "Erro ao excluir.", "error");
    }
    setLotToDelete(null);
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const formatDate = (date: Date) => {
    // Trata problemas de fuso horário ao exibir apenas a data
    const d = new Date(date);
    return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
  };

  if (!companyId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center text-zinc-500">
          <Layers className="w-8 h-8 animate-pulse mb-2 text-[#1E5AA8]" />
          <p>A carregar os seus lotes e compras...</p>
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
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Aquisições & Lotes</h1>
          <p className="text-[#4B4B4B] mt-1 text-sm md:text-base">Gere compras, garimpos e origens das suas peças.</p>
        </div>

        <div className="flex items-center w-full sm:w-auto">
          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Cadastrar Origem
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-[#0A244A]">{editingLot ? "Editar Origem" : "Cadastrar Nova Origem"}</DialogTitle>
                <DialogDescription className="text-[#4B4B4B] text-xs sm:text-sm">
                  Preencha os dados do local onde as peças foram compradas ou recebidas.
                </DialogDescription>
              </DialogHeader>

              <form key={editingLot?.id || "new"} onSubmit={handleSubmit} className="space-y-5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="sourceName" className="text-[#0A244A]">Fornecedor / Local</Label>
                    <Input id="sourceName" name="sourceName" placeholder="Ex: Bazar Beneficente" defaultValue={editingLot?.sourceName || ""} required autoFocus className="h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sourceType" className="text-[#0A244A]">Tipo de Origem</Label>
                    <select id="sourceType" name="sourceType" defaultValue={editingLot?.sourceType || ""} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] outline-none" required>
                      <option value="">Selecione...</option>
                      {SOURCE_TYPES.map(type => (
                        <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="code" className="text-[#0A244A]">Código Lote/NF (Opcional)</Label>
                    <Input id="code" name="code" placeholder="Gerado auto se vazio" defaultValue={editingLot?.code || ""} className="h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="purchaseDate" className="text-[#0A244A]">Data da Aquisição</Label>
                    <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={editingLot ? new Date(editingLot.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required className="h-10" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 border border-zinc-200 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="quantity" className="text-[#0A244A] font-bold">Quantidade de Peças</Label>
                    <Input id="quantity" name="quantity" type="number" min="1" placeholder="Ex: 50" defaultValue={editingLot?.quantity || ""} required className="h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="totalCost" className="text-[#0A244A] font-bold">Custo Total (R$)</Label>
                    <Input id="totalCost" name="totalCost" type="number" step="0.01" min="0" placeholder="Ex: 250.00" defaultValue={editingLot?.totalCost || ""} required className="h-10" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-[#0A244A]">Observações (Opcional)</Label>
                  <Input id="notes" name="notes" placeholder="Ex: Roupas de inverno para triagem..." defaultValue={editingLot?.notes || ""} className="h-10" />
                </div>

                <Button type="submit" className="w-full mt-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-12 text-base shadow-sm font-medium flex items-center justify-center gap-2" disabled={loading}>
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? "A processar..." : (editingLot ? "Salvar Alterações" : "Guardar Origem")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!lotToDelete} onOpenChange={(val) => !val && setLotToDelete(null)}>
            <DialogContent className="w-[90vw] sm:max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-zinc-600 mt-3 text-sm md:text-base">
                  Tem certeza que deseja excluir esta aquisição? Se existirem peças vinculadas a ela no estoque, a exclusão será bloqueada.
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
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {lots.length === 0 ? (
          <div className="p-12 md:p-16 text-center flex flex-col items-center justify-center">
            <Layers className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhuma origem cadastrada</h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              Comece cadastrando as suas compras ou garimpos para poder vincular as peças ao estoque.
            </p>
          </div>
        ) : (
          <>
            {/* VISTA MOBILE: Cartões (Cards) */}
            <div className="md:hidden flex flex-col divide-y divide-zinc-100">
              {lots.map((lot) => (
                <div key={lot.id} className="p-4 flex flex-col gap-3 hover:bg-zinc-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-[#0A244A] text-sm leading-tight">{lot.sourceName}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded">LOTE: {lot.code}</span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded-sm">
                          <MapPin className="w-3 h-3" /> {lot.sourceType.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleEditClick(lot)} className="p-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-md transition-colors cursor-pointer" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setLotToDelete(lot.id)} className="p-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-md transition-colors cursor-pointer" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-1 pt-3 border-t border-zinc-100">
                    <div>
                      <span className="flex text-[10px] uppercase text-zinc-500 font-semibold items-center gap-1 mb-0.5"><Calendar className="w-3 h-3" /> Data</span>                      <span className="font-medium text-[#4B4B4B] text-xs">{formatDate(lot.purchaseDate)}</span>
                    </div>
                    <div>
                      <span className="flex text-[10px] uppercase text-zinc-500 font-semibold items-center gap-1 mb-0.5"><Package className="w-3 h-3" /> Peças</span>                      <span className="font-medium text-[#4B4B4B] text-xs">{lot.quantity} unid.</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase text-zinc-500 font-semibold mb-0.5">Custo Total</span>
                      <span className="font-bold text-[#1E5AA8] text-sm">{formatCurrency(lot.totalCost)}</span>
                    </div>
                  </div>

                  {lot.notes && (
                    <div className="mt-1 bg-amber-50 px-2 py-1.5 rounded-md text-xs text-amber-700 flex items-start gap-1.5 border border-amber-100">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="leading-tight">{lot.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* VISTA DESKTOP: Tabela Tradicional */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-32 font-semibold">Código Lote</TableHead>
                    <TableHead className="font-semibold">Origem / Fornecedor</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="text-center font-semibold">Qtd Peças</TableHead>
                    <TableHead className="text-right font-semibold">Custo Total</TableHead>
                    <TableHead className="text-right w-28 font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.id} className="hover:bg-zinc-50/80 transition-colors">
                      <TableCell className="font-medium text-[#4B4B4B] text-xs">
                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded">{lot.code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#0A244A]">{lot.sourceName}</span>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                            <MapPin className="w-3 h-3" /> {lot.sourceType.replace(/_/g, ' ')}
                          </span>
                          {lot.notes && (
                            <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-1">
                              <AlertCircle className="w-3 h-3 shrink-0" /> {lot.notes}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#4B4B4B] text-sm font-medium">
                        {formatDate(lot.purchaseDate)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-[#4B4B4B]">
                        {lot.quantity}
                      </TableCell>
                      <TableCell className="font-bold text-[#1E5AA8] text-right">
                        {formatCurrency(lot.totalCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEditClick(lot)} className="p-2 text-zinc-400 hover:text-[#1E5AA8] hover:bg-blue-50 rounded-md transition-all cursor-pointer" title="Editar Aquisição">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setLotToDelete(lot.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer" title="Excluir Aquisição">
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