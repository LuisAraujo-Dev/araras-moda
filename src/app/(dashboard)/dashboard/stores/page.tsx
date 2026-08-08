"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store as StoreIcon, PlusCircle, CheckCircle2, AlertCircle, Pencil, Trash2, Phone, MapPin, Loader2 } from "lucide-react";
import { getStoresAction, createStoreAction, updateStoreAction, deleteStoreAction } from "@/app/actions/store.actions";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";
import { Store } from "@prisma/client";

type StoreWithCount = Store & {
  _count: { pieces: number; consignments: number; };
};

export default function StoresPage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [stores, setStores] = useState<StoreWithCount[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingStore, setEditingStore] = useState<StoreWithCount | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);

  const loadData = async (cid: string) => {
    const data = await getStoresAction(cid);
    setStores(data as StoreWithCount[]);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const status = await checkOnboardingStatusAction();
      if (status.success && status.companyId) {
        if (isMounted) setCompanyId(status.companyId);
        const data = await getStoresAction(status.companyId);
        if (isMounted) setStores(data as StoreWithCount[]);
      }
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
    if (!companyId) return;
    
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      commissionPercentage: 0,
      notes: formData.get("notes") as string,
    };

    let result;
    if (editingStore) {
      result = await updateStoreAction(editingStore.id, companyId, data);
    } else {
      result = await createStoreAction(companyId, data);
    }
    
    setLoading(false);

    if (result.success) {
      handleCloseModal(false);
      showBanner(editingStore ? "Parceiro atualizado!" : "Parceiro cadastrado!", "success");
      await loadData(companyId);
    } else {
      showBanner(result.error || "Erro ao guardar.", "error");
    }
  }

  async function confirmDelete() {
    if (!storeToDelete || !companyId) return;
    setLoading(true);
    const result = await deleteStoreAction(storeToDelete, companyId);
    setLoading(false);
    
    if (result.success) {
      showBanner("Parceiro excluído!", "success");
      setStoreToDelete(null);
      await loadData(companyId);
    } else {
      showBanner(result.error || "Erro ao excluir.", "error");
    }
  }

  if (!companyId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center text-zinc-500">
          <StoreIcon className="w-8 h-8 animate-pulse mb-2 text-[#1E5AA8]" />
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
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Parceiros</h1>
          <p className="text-[#4B4B4B] mt-1 text-sm md:text-base">Gira pontos de venda, doação ou compra.</p>
        </div>

        <div className="flex items-center w-full sm:w-auto">
          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Novo Parceiro
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-[#0A244A]">{editingStore ? "Editar Parceiro" : "Cadastrar Novo Parceiro"}</DialogTitle>
              </DialogHeader>
              <form key={editingStore?.id || "new"} onSubmit={handleSubmit} className="space-y-5 pt-2">
                <div className="space-y-1">
                    <Label htmlFor="name" className="text-[#0A244A]">Nome da Entidade / Loja</Label>
                    <Input id="name" name="name" defaultValue={editingStore?.name || ""} required autoFocus className="h-10" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="phone" className="text-[#0A244A]">Telefone / WhatsApp</Label>
                    <Input id="phone" name="phone" defaultValue={editingStore?.phone || ""} className="h-10" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="address" className="text-[#0A244A]">Endereço</Label>
                    <Input id="address" name="address" defaultValue={editingStore?.address || ""} className="h-10" />
                </div>
                <Button type="submit" className="w-full mt-2 bg-[#1E5AA8] hover:bg-[#103A73] text-white h-12 font-medium flex gap-2 items-center justify-center" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
                  {editingStore ? "Salvar Alterações" : "Guardar Parceiro"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {stores.length === 0 ? (
          <div className="p-16 text-center">
            <StoreIcon className="w-12 h-12 text-[#1E5AA8]/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhum parceiro</h3>
          </div>
        ) : (
          <div className="md:hidden flex flex-col divide-y divide-zinc-100">
            {stores.map((store) => (
              <div key={store.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-[#0A244A]">{store.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditClick(store)} className="p-2 text-blue-600 bg-blue-50 rounded-md"><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => setStoreToDelete(store.id)} className="p-2 text-rose-600 bg-rose-50 rounded-md"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 flex items-center gap-2"><Phone className="w-3 h-3"/> {store.phone || "Sem telefone"}</p>
                <p className="text-xs text-zinc-600 flex items-center gap-2"><MapPin className="w-3 h-3"/> {store.address || "Sem endereço"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}