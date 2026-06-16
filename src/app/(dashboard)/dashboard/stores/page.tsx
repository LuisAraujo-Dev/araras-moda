"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store as StoreIcon, PlusCircle } from "lucide-react";
import { createStoreAction, getStoresAction } from "@/app/actions/store.actions";
import { Store } from "@prisma/client";

export default function StoresPage() {
  const mockCompanyId = "company-placeholder-id";

  const [stores, setStores] = useState<Store[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadStores = useCallback(async () => {
    const data = await getStoresAction(mockCompanyId);
    setStores(data as Store[]);
  }, []);

  useEffect(() => {
    const fetchInitialStores = async () => {
      await loadStores();
    };
    fetchInitialStores();
  }, [loadStores]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
      address: formData.get("address") as string || undefined,
      commissionPercentage: Number(formData.get("commissionPercentage")),
      notes: formData.get("notes") as string || undefined,
    };

    const result = await createStoreAction(mockCompanyId, data);
    setLoading(false);

    if (result.success) {
      setOpen(false);
      await loadStores();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Parceiros comerciais</h1>
          <p className="text-zinc-500">Gerencie as lojas e brechós integrados ao seu fluxo de consignação.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className={`${buttonVariants({ variant: "default" })} flex items-center gap-2`}>
            <PlusCircle className="w-4 h-4" />
            Novo Parceiro
          </DialogTrigger>
          <DialogContent className="sm:max-w-450px">
            <DialogHeader>
              <DialogTitle>Registar Parceiro</DialogTitle>
              <DialogDescription>Insira os dados de contato e a taxa de comissão padrão do contrato.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="name">Nome do estabelecimento</Label>
                <Input id="name" name="name" placeholder="Ex: Brechó Vintage Chic" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="commissionPercentage">Comissão Padrão (%)</Label>
                  <Input id="commissionPercentage" name="commissionPercentage" type="number" min="0" max="100" placeholder="20" required />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">E-mail de contato</Label>
                <Input id="email" name="email" type="email" placeholder="contato@parceiro.com" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Endereço físico</Label>
                <Input id="address" name="address" placeholder="Rua, Número, Bairro" />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "A processar..." : "Salvar Parceiro"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {stores.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <StoreIcon className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900">Nenhum parceiro registado</h3>
            <p className="text-sm text-zinc-500 max-w-sm mt-1">Adicione lojas parceiras para habilitar o envio de peças consignadas.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium text-zinc-900">{store.name}</TableCell>
                  <TableCell>{store.phone || "-"}</TableCell>
                  <TableCell>{store.email || "-"}</TableCell>
                  <TableCell className="text-right font-medium text-zinc-700">
                    {store.commissionPercentage}%
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