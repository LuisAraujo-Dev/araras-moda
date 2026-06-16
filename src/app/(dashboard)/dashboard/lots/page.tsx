"use client";

import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Layers } from "lucide-react";
import { createLotAction, getLotsAction } from "@/app/actions/lot.actions";
import { Lot } from "@prisma/client";

export default function LotsPage() {
  const mockCompanyId = "company-placeholder-id"; 
  const [lots, setLots] = useState<Lot[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLots() {
      const data = await getLotsAction(mockCompanyId);
      setLots(data as Lot[]);
    }
    loadLots();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      code: formData.get("code") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      sourceName: formData.get("sourceName") as string,
      sourceType: formData.get("sourceType") as string,
      totalCost: Number(formData.get("totalCost")),
      quantity: mountaineer(formData.get("quantity") as string | null),
    };

    const result = await createLotAction(mockCompanyId, data);

    setLoading(false);
    if (result?.success) {
      setOpen(false);
      const updated = await getLotsAction(mockCompanyId);
      setLots(updated as Lot[]);
    } else {
      alert(result?.error || "Erro ao processar requisição.");
    }
  }

  function mountaineer(val: string | null) {
    return parseInt(val || "0", 10) || 0;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Lotes de Garimpo</h1>
          <p className="text-zinc-500">Registe e acompanhe a entrada de novos lotes de vestuário.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          {/* Resolvemos o conflito do asChild injetando o CSS do botão direto no Trigger */}
          <DialogTrigger className={`${buttonVariants({ variant: "default" })} flex items-center gap-2`}>
            <PlusCircle className="w-4 h-4" />
            Novo Lote
          </DialogTrigger>
          <DialogContent className="sm:max-w-425px">
            <DialogHeader>
              <DialogTitle>Registar Novo Lote</DialogTitle>
              <DialogDescription>Insira as informações de aquisição do lote.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-1">
                <Label htmlFor="code">Código do Lote</Label>
                <Input id="code" name="code" placeholder="Ex: LOTE-001" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="purchaseDate">Data da Compra</Label>
                <Input id="purchaseDate" name="purchaseDate" type="date" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sourceName">Origem / Fornecedor</Label>
                <Input id="sourceName" name="sourceName" placeholder="Ex: Bazar da Igreja" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sourceType">Tipo de Origem</Label>
                <select id="sourceType" name="sourceType" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                  <option value="BAZAR">Bazar</option>
                  <option value="IGREJA">Igreja</option>
                  <option value="PESSOA_FISICA">Pessoa Física</option>
                  <option value="BRECHO">Brechó</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="totalCost">Custo Total (R$)</Label>
                  <Input id="totalCost" name="totalCost" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="quantity">Qtd de Peças</Label>
                  <Input id="quantity" name="quantity" type="number" placeholder="1" required />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? "A guardar..." : "Salvar Lote"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {lots.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Layers className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900">Nenhum lote encontrado</h3>
            <p className="text-sm text-zinc-500 max-w-sm mt-1">Clique em Novo Lote para registar a sua primeira compra de garimpo.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Qtd Peças</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium">{lot.code}</TableCell>
                  <TableCell>{lot.sourceName}</TableCell>
                  <TableCell className="text-xs uppercase text-zinc-500">{lot.sourceType}</TableCell>
                  <TableCell>{new Date(lot.purchaseDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{lot.quantity}</TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(lot.totalCost)}
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