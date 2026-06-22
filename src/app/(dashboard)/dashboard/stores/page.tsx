//src/app/(dashboard)/dashboard/stores/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Store as StoreIcon, PlusCircle, CheckCircle2, AlertCircle, Pencil, Trash2, Phone, Mail, MapPin, Percent } from "lucide-react";
import { getStoresAction, createStoreAction, updateStoreAction, deleteStoreAction } from "@/app/actions/store.actions";
import { Store } from "@prisma/client";

type StoreWithCount = Store & {
  _count: {
    pieces: number;
    consignments: number;
  };
};

export default function StoresPage() {
  const mockCompanyId = "company-placeholder-id";

  const [stores, setStores] = useState<StoreWithCount[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingStore, setEditingStore] = useState<StoreWithCount | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);

  const loadData = async () => {
    const data = await getStoresAction(mockCompanyId);
    setStores(data as StoreWithCount[]);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const data = await getStoresAction(mockCompanyId);
      if (isMounted) setStores(data as StoreWithCount[]);
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleEditClick = (store: StoreWithCount) => {
    setEditingStore(store);
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) setEditingStore(null);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      commissionPercentage: Number(formData.get("commissionPercentage")),
      notes: formData.get("notes") as string,
    };

    let result;
    if (editingStore) {
      result = await updateStoreAction(editingStore.id, mockCompanyId, data);
    } else {
      result = await createStoreAction(mockCompanyId, data);
    }
    
    setLoading(false);

    if (result.success) {
      handleCloseModal(false);
      showBanner(editingStore ? "Parceiro atualizado com sucesso!" : "Parceiro cadastrado com sucesso!", "success");
      await loadData();
    } else {
      showBanner(result.error || "Erro ao guardar o parceiro.", "error");
    }
  }

  async function confirmDelete() {
    if (!storeToDelete) return;
    setLoading(true);
    const result = await deleteStoreAction(storeToDelete, mockCompanyId);
    setLoading(false);
    
    if (result.success) {
      showBanner("Parceiro excluído com sucesso!", "success");
      setStoreToDelete(null);
      await loadData();
    } else {
      showBanner(result.error || "Erro ao excluir. O parceiro tem itens vinculados.", "error");
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Parceiros</h1>
          <p className="text-[#4B4B4B] mt-1">Gira os seus parceiros de consignação, lojas e comissões.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Novo Parceiro
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#0A244A]">{editingStore ? "Editar Parceiro" : "Cadastrar Novo Parceiro"}</DialogTitle>
                <DialogDescription className="text-[#4B4B4B]">
                  Preencha os dados da loja, contatos e a taxa de comissão cobrada nas vendas.
                </DialogDescription>
              </DialogHeader>

              <form key={editingStore?.id || "new"} onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="name" className="text-[#0A244A]">Nome do Parceiro / Loja</Label>
                    <Input id="name" name="name" placeholder="Ex: Peça Rara Conjunto" defaultValue={editingStore?.name || ""} required autoFocus />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label htmlFor="commissionPercentage" className="text-[#0A244A] flex items-center gap-1">
                      Comissão <Percent className="w-3 h-3" />
                    </Label>
                    <Input id="commissionPercentage" name="commissionPercentage" type="number" step="0.1" min="0" max="100" defaultValue={editingStore?.commissionPercentage || "50"} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-[#0A244A]">Telefone / WhatsApp (Opcional)</Label>
                    <Input id="phone" name="phone" placeholder="(00) 00000-0000" defaultValue={editingStore?.phone || ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[#0A244A]">E-mail (Opcional)</Label>
                    <Input id="email" name="email" type="email" placeholder="loja@email.com" defaultValue={editingStore?.email || ""} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address" className="text-[#0A244A]">Endereço Completo (Opcional)</Label>
                  <Input id="address" name="address" placeholder="Ex: Rua X, Quadra Y, Lote Z - Cidade..." defaultValue={editingStore?.address || ""} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-[#0A244A]">Observações (Opcional)</Label>
                  <Input id="notes" name="notes" placeholder="Ex: Falar com o gerente João..." defaultValue={editingStore?.notes || ""} />
                </div>

                <Button type="submit" className="w-full mt-4 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-11 text-base shadow-sm" disabled={loading}>
                  {loading ? "A processar..." : (editingStore ? "Salvar Alterações" : "Guardar Parceiro")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!storeToDelete} onOpenChange={(val) => !val && setStoreToDelete(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-zinc-600 mt-3 text-base">
                  Tem certeza que deseja excluir este parceiro? A exclusão só será permitida se não houverem peças ou remessas vinculadas a ele.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setStoreToDelete(null)} disabled={loading}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer" onClick={confirmDelete} disabled={loading}>
                  {loading ? "A processar..." : "Sim, Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {stores.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <StoreIcon className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhum parceiro cadastrado</h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              Cadastre brechós, lojas e parceiros que revendem as suas peças em consignação.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-80">Parceiro</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead className="text-center">Comissão</TableHead>
                <TableHead className="text-center">Vinculados</TableHead>
                <TableHead className="text-right w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-[#0A244A] text-base">{store.name}</span>
                      {store.address ? (
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" /> {store.address}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400 italic flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Sem endereço cadastrado
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-[#4B4B4B] flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" /> 
                        {store.phone || <span className="text-xs italic text-zinc-400">Não informado</span>}
                      </span>
                      <span className="text-sm text-[#4B4B4B] flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" /> 
                        {store.email || <span className="text-xs italic text-zinc-400">Não informado</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#1E5AA8]/10 text-[#1E5AA8] border-[#1E5AA8]/20 font-bold px-2.5 py-0.5">
                      {store.commissionPercentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                        {store._count.pieces} Peças
                      </span>
                      <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {store._count.consignments} Remessas
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEditClick(store)} className="p-2 text-zinc-400 hover:text-[#1E5AA8] hover:bg-blue-50 rounded-md transition-colors cursor-pointer" title="Editar Parceiro">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setStoreToDelete(store.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer" title="Excluir Parceiro">
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