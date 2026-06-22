"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, PlusCircle, CheckCircle2, AlertCircle, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
import { getFinancialDataAction, createTransactionAction, updateTransactionAction, deleteTransactionAction } from "@/app/actions/finance.actions";
import { RevenueType, ExpenseCategory } from "@prisma/client";

const REVENUE_TYPES = Object.values(RevenueType);
const EXPENSE_CATEGORIES = Object.values(ExpenseCategory);

type Transaction = {
  id: string;
  kind: 'REVENUE' | 'EXPENSE';
  amount: number;
  categoryLabel: string;
  description: string | null;
  date: Date;
};

export default function FinancePage() {
  const mockCompanyId = "company-placeholder-id";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalExpense: 0, balance: 0 });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<{ id: string, kind: 'REVENUE' | 'EXPENSE' } | null>(null);

  const [txKind, setTxKind] = useState<'REVENUE' | 'EXPENSE'>('REVENUE');

  const loadData = async () => {
    const data = await getFinancialDataAction(mockCompanyId);
    setTransactions(data.transactions);
    setSummary({ totalRevenue: data.totalRevenue, totalExpense: data.totalExpense, balance: data.balance });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const data = await getFinancialDataAction(mockCompanyId);
      if (isMounted) {
        setTransactions(data.transactions);
        setSummary({ totalRevenue: data.totalRevenue, totalExpense: data.totalExpense, balance: data.balance });
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleEditClick = (tx: Transaction) => {
    setEditingTx(tx);
    setTxKind(tx.kind);
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setEditingTx(null);
      setTxKind('REVENUE');
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    
    const data = {
      kind: txKind,
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      date: new Date(formData.get("date") as string),
    };

    let result;
    if (editingTx) {
      result = await updateTransactionAction(editingTx.id, mockCompanyId, data);
    } else {
      result = await createTransactionAction(mockCompanyId, data);
    }
    
    setLoading(false);

    if (result.success) {
      handleCloseModal(false);
      showBanner(editingTx ? "Transação atualizada!" : "Transação registada com sucesso!", "success");
      await loadData();
    } else {
      showBanner(result.error || "Erro ao guardar a transação.", "error");
    }
  }

  async function confirmDelete() {
    if (!txToDelete) return;
    setLoading(true);
    const result = await deleteTransactionAction(txToDelete.id, txToDelete.kind, mockCompanyId);
    setLoading(false);
    
    if (result.success) {
      showBanner("Transação excluída com sucesso!", "success");
      setTxToDelete(null);
      await loadData();
    } else {
      showBanner(result.error || "Erro ao excluir.", "error");
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const formatDate = (date: Date) => 
    new Intl.DateTimeFormat("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

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
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Financeiro</h1>
          <p className="text-[#4B4B4B] mt-1">Acompanhe as receitas, despesas e a saúde do fluxo de caixa.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Nova Transação
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#0A244A]">{editingTx ? "Editar Transação" : "Registar Nova Transação"}</DialogTitle>
                <DialogDescription className="text-[#4B4B4B]">
                  Adicione uma nova entrada ou saída ao fluxo de caixa.
                </DialogDescription>
              </DialogHeader>

              <form key={editingTx?.id || "new"} onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="flex p-1 bg-zinc-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTxKind('REVENUE')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${txKind === 'REVENUE' ? 'bg-white text-emerald-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxKind('EXPENSE')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${txKind === 'EXPENSE' ? 'bg-white text-rose-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Saída (Despesa)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="amount" className="text-[#0A244A]">Valor (R$)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={editingTx?.amount || ""} required autoFocus />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="date" className="text-[#0A244A]">Data</Label>
                    <Input id="date" name="date" type="date" defaultValue={editingTx ? new Date(editingTx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="category" className="text-[#0A244A]">Categoria</Label>
                  <select id="category" name="category" defaultValue={editingTx?.categoryLabel || ""} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                    <option value="">Selecione...</option>
                    {txKind === 'REVENUE' 
                      ? REVENUE_TYPES.map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>)
                      : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>)
                    }
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description" className="text-[#0A244A]">Descrição / Referência</Label>
                  <Input id="description" name="description" placeholder="Ex: Venda de calças, Compra de cabides..." defaultValue={editingTx?.description || ""} required />
                </div>

                <Button type="submit" className="w-full mt-4 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-11 text-base shadow-sm" disabled={loading}>
                  {loading ? "A processar..." : (editingTx ? "Salvar Alterações" : "Registar Transação")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!txToDelete} onOpenChange={(val) => !val && setTxToDelete(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-zinc-600 mt-3 text-base">
                  Tem certeza que deseja excluir esta transação? O saldo será recalculado imediatamente.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setTxToDelete(null)} disabled={loading}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer" onClick={confirmDelete} disabled={loading}>
                  {loading ? "A processar..." : "Sim, Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Entradas</h3>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#0A244A]">{formatCurrency(summary.totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Saídas</h3>
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#0A244A]">{formatCurrency(summary.totalExpense)}</p>
        </div>

        <div className={`rounded-xl border p-6 shadow-sm flex flex-col justify-between ${summary.balance >= 0 ? 'bg-[#1E5AA8] border-[#103A73]' : 'bg-rose-600 border-rose-800'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Saldo Atual</h3>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(summary.balance)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="font-semibold text-[#0A244A]">Extrato de Transações</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <DollarSign className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhuma transação registada</h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              Registe as vendas, recebimentos de consignações e os custos da loja.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-[#4B4B4B] text-sm">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {formatDate(tx.date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-[#0A244A]">{tx.description}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-medium px-2 py-0.5 text-xs ${tx.kind === 'REVENUE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {tx.categoryLabel.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-semibold text-right ${tx.kind === 'REVENUE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.kind === 'REVENUE' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEditClick(tx)} className="p-2 text-zinc-400 hover:text-[#1E5AA8] hover:bg-blue-50 rounded-md transition-colors cursor-pointer" title="Editar Transação">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setTxToDelete({ id: tx.id, kind: tx.kind })} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer" title="Excluir Transação">
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