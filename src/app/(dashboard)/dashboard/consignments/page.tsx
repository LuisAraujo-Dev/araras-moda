"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Handshake, PlusCircle, Calendar } from "lucide-react";
import { createConsignmentAction, getConsignmentsAction, getAvailablePiecesAction } from "@/app/actions/consignment.actions";
import { getStoresAction } from "@/app/actions/store.actions";
import { Consignment, Store, Piece, ConsignmentItem } from "@prisma/client";

type ConsignmentWithRelations = Consignment & {
  store: Store;
  items: (ConsignmentItem & {
    piece: Piece;
  })[];
};

export default function ConsignmentsPage() {
  const mockCompanyId = "company-placeholder-id";
  const mockUserId = "user-placeholder-id";

  const [consignments, setConsignments] = useState<ConsignmentWithRelations[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [availablePieces, setAvailablePieces] = useState<Piece[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [consignmentsData, storesData, piecesData] = await Promise.all([
      getConsignmentsAction(mockCompanyId),
      getStoresAction(mockCompanyId),
      getAvailablePiecesAction(mockCompanyId),
    ]);
    setConsignments(consignmentsData as ConsignmentWithRelations[]);
    setStores(storesData as Store[]);
    setAvailablePieces(piecesData as Piece[]);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      await loadData();
    };
    fetchInitialData();
  }, [loadData]);

  function handlePieceToggle(pieceId: string) {
    setSelectedPieces((prev) =>
      prev.includes(pieceId) ? prev.filter((id) => id !== pieceId) : [...prev, pieceId]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedPieces.length === 0) {
      alert("Selecione pelo menos uma peça para consignação.");
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    const data = {
      storeId: formData.get("storeId") as string,
      startDate: formData.get("startDate") as string,
      expectedReturnDate: formData.get("expectedReturnDate") as string || undefined,
      pieceIds: selectedPieces,
    };

    const result = await createConsignmentAction(mockCompanyId, mockUserId, data);
    setLoading(false);

    if (result.success) {
      setOpen(false);
      setSelectedPieces([]);
      await loadData();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Contratos de Consignação</h1>
          <p className="text-zinc-500">Envie e monitorize o fluxo de mercadorias em lojas parceiras.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className={`${buttonVariants({ variant: "default" })} flex items-center gap-2`}>
            <PlusCircle className="w-4 h-4" />
            Novo Contrato
          </DialogTrigger>
          <DialogContent className="sm:max-w-500px">
            <DialogHeader>
              <DialogTitle>Emitir Consignação</DialogTitle>
              <DialogDescription>Selecione o estabelecimento de destino e as peças que serão transferidas.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="storeId">Parceiro de Destino</Label>
                <select id="storeId" name="storeId" className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                  <option value="">Selecione um parceiro...</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.commissionPercentage}%)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="startDate">Data de Envio</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expectedReturnDate">Previsão de Retorno</Label>
                  <Input id="expectedReturnDate" name="expectedReturnDate" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Selecionar Peças Disponíveis ({availablePieces.length})</Label>
                <div className="border border-zinc-200 rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-zinc-50">
                  {availablePieces.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-4">Nenhuma peça disponível no estoque físico.</p>
                  ) : (
                    availablePieces.map((piece) => (
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

              <Button type="submit" className="w-full mt-2" disabled={loading || availablePieces.length === 0}>
                {loading ? "A processar..." : "Firmar Contrato"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {consignments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Handshake className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900">Nenhum contrato ativo</h3>
            <p className="text-sm text-zinc-500 max-w-sm mt-1">Crie um novo contrato para transferir peças do estoque para os seus parceiros comerciais.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parceiro</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Previsão Retorno</TableHead>
                <TableHead className="text-center">Qtd Itens</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consignments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-zinc-900">{item.store.name}</TableCell>
                  <TableCell className="text-zinc-600">
                    {new Date(item.startDate).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {item.expectedReturnDate ? new Date(item.expectedReturnDate).toLocaleDateString("pt-BR") : "-"}
                  </TableCell>
                  <TableCell className="text-center font-medium">{item.items.length}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                      {item.status.toLowerCase()}
                    </Badge>
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