"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, PlusCircle } from "lucide-react";
import { 
  createRevenueAction, 
  createExpenseAction, 
  getRevenuesAction, 
  getExpensesAction,
  getActivePiecesForApportionmentAction
} from "@/app/actions/finance.actions";
import { Revenue, Expense } from "@prisma/client";

// Tipo simplificado para a listagem de rateio
type MinimalPiece = { id: string; code: string; name: string };

export default function FinancePage() {
  const mockCompanyId = "company-placeholder-id";

  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pieces, setPieces] = useState<MinimalPiece[]>([]);
  
  const [openRev, setOpenRev] = useState(false);
  const [openExp, setOpenExp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const [revData, expData, piecesData] = await Promise.all([
      getRevenuesAction(mockCompanyId),
      getExpensesAction(mockCompanyId),
      getActivePiecesForApportionmentAction(mockCompanyId)
    ]);
    setRevenues(revData as Revenue[]);
    setExpenses(expData as Expense[]);
    setPieces(piecesData as MinimalPiece[]);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      await loadData();
    };
    fetchInitialData();
  }, [loadData]);

  async function handleRevenueSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    const data = {
      amount: Number(formData.get("amount")),
      type: formData.get("type") as string,
      date: formData.get("date") as string,
      description: formData.get("description") as string || undefined,
    };

    const result = await createRevenueAction(mockCompanyId, data);
    setLoading(false);

    if (result.success) {
      setOpenRev(false);
      await loadData();
    } else {
      alert(result.error);
    }
  }

  async function handleExpenseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    const data = {
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      date: formData.get("date") as string,
      description: formData.get("description") as string || undefined,
      pieceIdsToApportion: selectedPieces.length > 0 ? selectedPieces : undefined,
    };

    const result = await createExpenseAction(mockCompanyId, data);
    setLoading(false);

    if (result.success) {
      setOpenExp(false);
      setSelectedPieces([]);
      await loadData();
    } else {
      alert(result.error);
    }
  }

  function handlePieceToggle(pieceId: string) {
    setSelectedPieces((prev) =>
      prev.includes(pieceId) ? prev.filter((id) => id !== pieceId) : [...prev, pieceId]
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Financeiro</h1>
          <p className="text-zinc-500">Controle o seu fluxo de caixa e o rateio de custos das peças.</p>
        </div>
      </div>

      <Tabs defaultValue="revenues" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="revenues" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Receitas
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Despesas
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {/* Modal de Receita */}
            <Dialog open={openRev} onOpenChange={setOpenRev}>
              <DialogTrigger className={`${buttonVariants({ variant: "outline" })} flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50`}>
                <PlusCircle className="w-4 h-4" /> Nova Receita
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Receita</DialogTitle>
                  <DialogDescription>Entrada de valores avulsos no caixa da operação.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRevenueSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="date">Data</Label>
                      <Input id="date" name="date" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="type">Tipo de Receita</Label>
                    <select id="type" name="type" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="VENDA">Venda Direta</option>
                      <option value="REEMBOLSO">Reembolso</option>
                      <option value="OUTRO">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description">Descrição</Label>
                    <Input id="description" name="description" placeholder="Ex: Venda no bazar local" />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? "Salvando..." : "Registrar Receita"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Modal de Despesa */}
            <Dialog open={openExp} onOpenChange={setOpenExp}>
              <DialogTrigger className={`${buttonVariants({ variant: "default" })} flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white`}>
                <PlusCircle className="w-4 h-4" /> Nova Despesa
              </DialogTrigger>
              <DialogContent className="sm:max-w-125">
                <DialogHeader>
                  <DialogTitle>Registrar Despesa / Custo</DialogTitle>
                  <DialogDescription>Custos operacionais e rateio inteligente de gastos.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleExpenseSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="date">Data</Label>
                      <Input id="date" name="date" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category">Categoria do Gasto</Label>
                    <select id="category" name="category" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                      <option value="LIMPEZA">Limpeza / Lavanderia</option>
                      <option value="REPARO">Costura / Reparos</option>
                      <option value="TRANSPORTE">Transporte / Frete</option>
                      <option value="EMBALAGEM">Embalagens</option>
                      <option value="MARKETING">Marketing / Anúncios</option>
                      <option value="OUTRO">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description">Descrição</Label>
                    <Input id="description" name="description" placeholder="Ex: Sabão líquido e amaciante" />
                  </div>
                  
                  {/* Seção de Rateio Inteligente */}
                  <div className="space-y-2 pt-2 border-t border-zinc-200">
                    <Label>Rateio de Custo (Opcional)</Label>
                    <p className="text-xs text-zinc-500">Selecione as peças que consumiram este serviço/produto para o sistema calcular o custo individual de cada uma automaticamente.</p>
                    <div className="border border-zinc-200 rounded-md p-3 max-h-32 overflow-y-auto space-y-2 bg-zinc-50">
                      {pieces.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-2">Nenhuma peça cadastrada.</p>
                      ) : (
                        pieces.map((piece) => (
                          <label key={piece.id} className="flex items-center gap-3 text-sm font-medium text-zinc-700 cursor-pointer p-1 hover:bg-zinc-100 rounded">
                            <input
                              type="checkbox"
                              checked={selectedPieces.includes(piece.id)}
                              onChange={() => handlePieceToggle(piece.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <span>{piece.code} - {piece.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={loading}>
                    {loading ? "Salvando..." : "Registrar Despesa"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* TAB DE RECEITAS */}
        <TabsContent value="revenues" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {revenues.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <DollarSign className="w-12 h-12 text-emerald-300 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900">Nenhuma receita registrada</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.map((rev) => (
                  <TableRow key={rev.id}>
                    <TableCell className="text-zinc-600">{new Date(rev.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">{rev.type}</Badge></TableCell>
                    <TableCell className="text-zinc-600">{rev.description || "-"}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(rev.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* TAB DE DESPESAS */}
        <TabsContent value="expenses" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {expenses.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <DollarSign className="w-12 h-12 text-rose-300 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900">Nenhuma despesa registrada</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Rateio Ativo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="text-zinc-600">{new Date(exp.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-rose-700 border-rose-200 bg-rose-50">{exp.category}</Badge></TableCell>
                    <TableCell className="text-zinc-600">{exp.description || "-"}</TableCell>
                    <TableCell className="text-center">
                      {exp.isApportioned ? (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sim</Badge>
                      ) : (
                        <span className="text-zinc-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-600">-{formatCurrency(exp.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}