// src/app/(dashboard)/dashboard/stores/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Store as StoreIcon, PlusCircle, AlertCircle, Pencil, Trash2, Phone, MapPin, Loader2, CheckCircle2 } from "lucide-react";
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

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
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
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl ${banner.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Parceiros</h1>
          <p className="text-[#4B4B4B] mt-1 text-sm md:text-base">Gira pontos de venda, doação ou compra.</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setEditingStore(null); }}>
          <DialogTrigger className="bg-[#1E5AA8] hover:bg-[#103A73] transition-colors text-white h-10 px-4 rounded-md flex items-center gap-2 text-sm font-medium shadow-sm cursor-pointer">
            <PlusCircle className="w-4 h-4" /> Novo Parceiro
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-xl rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-[#0A244A]">{editingStore ? "Editar Parceiro" : "Cadastrar Parceiro"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <Input name="name" placeholder="Nome" defaultValue={editingStore?.name} required />
              <select name="type" className="w-full h-10 border border-zinc-200 rounded-md px-3 bg-white text-sm outline-none focus:border-[#1E5AA8]" defaultValue={editingStore?.type || "Fornecedor"}>
                <option value="Fornecedor">Fornecedor</option>
                <option value="Brechó">Brechó</option>
                <option value="Bazar">Bazar</option>
                <option value="Igreja">Igreja</option>
                <option value="Atacado">Atacado</option>
                <option value="Vendedor">Vendedor</option>
              </select>
              <Input name="phone" placeholder="WhatsApp" defaultValue={editingStore?.phone || ""} />
              <Input name="address" placeholder="Endereço" defaultValue={editingStore?.address || ""} />
              <Button type="submit" className="w-full bg-[#1E5AA8] hover:bg-[#103A73] text-white flex gap-2 h-11" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "A processar..." : (editingStore ? "Salvar Alterações" : "Cadastrar")}
              </Button>
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
              <Button variant="outline" className="flex-1 h-11 cursor-pointer" onClick={() => setStoreToDelete(null)} disabled={loading}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white h-11 cursor-pointer" onClick={handleConfirmDelete} disabled={loading}>
                {loading ? "A processar..." : "Sim, Excluir"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {stores.length === 0 ? (
          <div className="p-12 md:p-16 text-center flex flex-col items-center justify-center">
            <StoreIcon className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhum parceiro registado</h3>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {stores.map((store) => (
              <div key={store.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <h3 className="font-semibold text-[#0A244A]">{store.name}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mt-0.5 bg-zinc-100 px-1.5 py-0.5 rounded w-fit">{store.type}</p>
                  <div className="text-xs mt-2 space-y-1 text-zinc-600">
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> {store.phone || "Sem telefone"}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {store.address || "Sem endereço"}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 self-end sm:self-auto">
                  <button onClick={() => { setEditingStore(store); setOpen(true); }} className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-md transition-colors cursor-pointer" title="Editar Parceiro">
                    <Pencil className="w-4 h-4"/>
                  </button>
                  <button onClick={() => setStoreToDelete(store.id)} className="p-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md transition-colors cursor-pointer" title="Excluir Parceiro">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}