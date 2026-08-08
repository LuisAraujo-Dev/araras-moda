"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Store as StoreIcon, PlusCircle, AlertCircle, Pencil, Trash2, Phone, MapPin } from "lucide-react";
import { getStoresAction, createStoreAction, updateStoreAction, deleteStoreAction } from "@/app/actions/store.actions";
import { checkOnboardingStatusAction } from "@/app/actions/setup.actions";
import { Store } from "@prisma/client";

type StoreWithCount = Store & {
  type?: string;
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
      type: formData.get("type") as string,
      commissionPercentage: 0,
      notes: formData.get("notes") as string,
    };
    const result = editingStore 
      ? await updateStoreAction(editingStore.id, companyId, data)
      : await createStoreAction(companyId, data);
    setLoading(false);
    if (result.success) {
      setOpen(false);
      setEditingStore(null);
      showBanner("Parceiro processado!", "success");
      await loadData(companyId);
    } else {
      showBanner(result.error || "Erro.", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!storeToDelete || !companyId) return;
    setLoading(true);
    const result = await deleteStoreAction(storeToDelete, companyId);
    setLoading(false);
    if (result.success) {
      showBanner("Excluído!", "success");
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
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl ${banner.type === "success" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-3xl font-bold text-[#0A244A]">Parceiros</h1>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setEditingStore(null); }}>
          <DialogTrigger className="bg-[#1E5AA8] text-white h-10 px-4 rounded-md flex items-center gap-2 text-sm font-medium">
            <PlusCircle className="w-4 h-4" /> Novo Parceiro
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-xl rounded-xl">
            <DialogHeader>
              <DialogTitle>{editingStore ? "Editar" : "Cadastrar"} Parceiro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <Input name="name" placeholder="Nome" defaultValue={editingStore?.name} required />
              <select name="type" className="w-full h-10 border rounded px-2" defaultValue={editingStore?.type || "Fornecedor"}>
                <option value="Fornecedor">Fornecedor</option>
                <option value="Caridade">Caridade</option>
                <option value="Vendedor">Vendedor</option>
              </select>
              <Input name="phone" placeholder="WhatsApp" defaultValue={editingStore?.phone || ""} />
              <Input name="address" placeholder="Endereço" defaultValue={editingStore?.address || ""} />
              <Button className="w-full bg-[#1E5AA8]" disabled={loading}>{loading ? "A processar..." : "Guardar"}</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!storeToDelete} onOpenChange={(val) => !val && setStoreToDelete(null)}>
          <DialogContent className="w-[90vw] sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStoreToDelete(null)} disabled={loading}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white h-11" onClick={handleConfirmDelete} disabled={loading}>
                {loading ? "A processar..." : "Sim, Excluir"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {stores.map((store) => (
          <div key={store.id} className="p-4 border-b flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{store.name}</h3>
              <p className="text-xs text-zinc-500 uppercase font-bold">{store.type}</p>
              <div className="text-xs mt-2 space-y-1">
                <p className="flex items-center gap-1"><Phone className="w-3 h-3"/> {store.phone || "Sem tel"}</p>
                <p className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {store.address || "Sem end"}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditingStore(store); setOpen(true); }} className="p-2 text-blue-600 bg-blue-50 rounded"><Pencil className="w-4 h-4"/></button>
              <button onClick={() => setStoreToDelete(store.id)} className="p-2 text-rose-600 bg-rose-50 rounded"><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}