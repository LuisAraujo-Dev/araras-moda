//src/app/(dashboard)/dashboard/consignments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Handshake, PlusCircle, CheckCircle2, AlertCircle, Pencil, Trash2, Calendar, Store as StoreIcon, PackageSearch, XCircle } from "lucide-react";
import { getConsignmentsAction, createConsignmentAction, updateConsignmentAction, deleteConsignmentAction, getStoresAction, getAvailablePiecesAction } from "@/app/actions/consignment.actions";
import { Consignment, Store, ConsignmentStatus } from "@prisma/client";

type ConsignmentItemData = {
  pieceId: string;
  status: string;
  rejectionReason: string | null;
  piece: {
    code: string;
    name: string;
  };
};

type ConsignmentWithRelations = Consignment & {
  store: Store;
  items: ConsignmentItemData[];
};

type PieceBasicData = {
  id: string;
  code: string;
  name: string;
  purchasePrice: number;
};

type SelectedPieceState = {
  status: string;
  reason: string;
};

const STATUS_MAP: Record<ConsignmentStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Ativa (Em Loja)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  FINISHED: { label: "Finalizada (Acerto Feito)", color: "bg-blue-100 text-blue-800 border-blue-200" },
  RETURNED: { label: "Devolvida (Expirada)", color: "bg-zinc-200 text-zinc-800 border-zinc-300" },
};

export default function ConsignmentsPage() {
  const router = useRouter();
  const mockCompanyId = "company-placeholder-id";

  const [consignments, setConsignments] = useState<ConsignmentWithRelations[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [availablePieces, setAvailablePieces] = useState<PieceBasicData[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingConsignment, setEditingConsignment] = useState<ConsignmentWithRelations | null>(null);
  const [consignmentToDelete, setConsignmentToDelete] = useState<string | null>(null);

  const [storeId, setStoreId] = useState("");
  const [selectedPieces, setSelectedPieces] = useState<Record<string, SelectedPieceState>>({});
  const [searchPiece, setSearchPiece] = useState("");

  const loadData = async () => {
    const [consignmentsData, storesData, piecesData] = await Promise.all([
      getConsignmentsAction(mockCompanyId),
      getStoresAction(mockCompanyId),
      getAvailablePiecesAction(mockCompanyId)
    ]);
    setConsignments(consignmentsData as ConsignmentWithRelations[]);
    setStores(storesData as Store[]);
    setAvailablePieces(piecesData as PieceBasicData[]);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const [consignmentsData, storesData, piecesData] = await Promise.all([
        getConsignmentsAction(mockCompanyId),
        getStoresAction(mockCompanyId),
        getAvailablePiecesAction(mockCompanyId)
      ]);
      if (isMounted) {
        setConsignments(consignmentsData as ConsignmentWithRelations[]);
        setStores(storesData as Store[]);
        setAvailablePieces(piecesData as PieceBasicData[]);
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleEditClick = (consignment: ConsignmentWithRelations) => {
    setEditingConsignment(consignment);
    setStoreId(consignment.storeId);
    
    const initialSelection: Record<string, SelectedPieceState> = {};
    consignment.items.forEach(item => {
      initialSelection[item.pieceId] = {
        status: item.status,
        reason: item.rejectionReason || ""
      };
    });
    setSelectedPieces(initialSelection);
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setEditingConsignment(null);
      setStoreId("");
      setSelectedPieces({});
      setSearchPiece("");
    }
  };

  const togglePieceSelection = (id: string) => {
    setSelectedPieces(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { status: 'ACCEPTED', reason: '' };
      }
      return next;
    });
  };

  const updatePieceStatus = (id: string, val: string) => {
    setSelectedPieces(prev => ({
      ...prev,
      [id]: val === 'ACCEPTED' 
        ? { status: 'ACCEPTED', reason: '' } 
        : { status: 'REJECTED', reason: val }
    }));
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredPieces.map(p => p.id);
    const allSelected = filteredIds.every(id => !!selectedPieces[id]);
    
    if (allSelected) {
      setSelectedPieces(prev => {
        const next = { ...prev };
        filteredIds.forEach(id => delete next[id]);
        return next;
      });
    } else {
      setSelectedPieces(prev => {
        const next = { ...prev };
        filteredIds.forEach(id => {
          if (!next[id]) next[id] = { status: 'ACCEPTED', reason: '' };
        });
        return next;
      });
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storeId) {
      showBanner("Selecione um parceiro.", "error");
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const expectedReturnDateRaw = formData.get("expectedReturnDate") as string;
    
    const data = {
      storeId: storeId,
      startDate: new Date(formData.get("startDate") as string),
      expectedReturnDate: expectedReturnDateRaw ? new Date(expectedReturnDateRaw) : null,
      status: formData.get("status") as ConsignmentStatus,
      pieces: Object.entries(selectedPieces).map(([id, info]) => ({
        id,
        status: info.status,
        reason: info.reason
      })),
    };

    let result;
    if (editingConsignment) {
      result = await updateConsignmentAction(editingConsignment.id, mockCompanyId, data);
    } else {
      result = await createConsignmentAction(mockCompanyId, data);
    }
    
    setLoading(false);

    if (result.success) {
      handleCloseModal(false);
      showBanner(editingConsignment ? "Remessa atualizada com sucesso!" : "Nova remessa criada com sucesso!", "success");
      await loadData();
    } else {
      showBanner(result.error || "Erro ao guardar a remessa.", "error");
    }
  }

  async function confirmDelete() {
    if (!consignmentToDelete) return;
    setLoading(true);
    const result = await deleteConsignmentAction(consignmentToDelete, mockCompanyId);
    setLoading(false);
    
    if (result.success) {
      showBanner("Remessa excluída com sucesso!", "success");
      setConsignmentToDelete(null);
      await loadData();
    } else {
      showBanner(result.error || "Erro ao excluir a remessa.", "error");
    }
  }

  const formatDate = (date: Date | null) => 
    date ? new Intl.DateTimeFormat("pt-BR").format(new Date(date)) : "Não definida";

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const filteredPieces = availablePieces.filter(p => 
    p.code.toLowerCase().includes(searchPiece.toLowerCase()) || 
    p.name.toLowerCase().includes(searchPiece.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Consignações</h1>
          <p className="text-[#4B4B4B] mt-1">Gira remessas e avaliações. As peças devolvidas atualizam o estoque automaticamente.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={handleCloseModal}>
            <DialogTrigger className="flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> Nova Remessa
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#0A244A]">{editingConsignment ? "Editar Remessa" : "Criar Nova Remessa"}</DialogTitle>
                <DialogDescription className="text-[#4B4B4B]">
                  Selecione as peças levadas e indique caso alguma tenha sido devolvida na avaliação.
                </DialogDescription>
              </DialogHeader>

              <form key={editingConsignment?.id || "new"} onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="storeId" className="text-[#0A244A]">Loja Parceira</Label>
                  <select 
                    id="storeId" 
                    value={storeId} 
                    onChange={(e) => { 
                      if (e.target.value === "NEW") { 
                        router.push('/dashboard/stores'); 
                      } else { 
                        setStoreId(e.target.value); 
                      } 
                    }} 
                    className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" 
                    required
                  >
                    <option value="">Selecione o destino...</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                    <option value="NEW" className="font-bold text-[#1E5AA8]">+ Cadastrar Novo Parceiro (Ir para tela)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-[#0A244A]">Data do Envio / Avaliação</Label>
                    <Input id="startDate" name="startDate" type="date" defaultValue={editingConsignment ? new Date(editingConsignment.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="expectedReturnDate" className="text-[#0A244A]">Previsão de Retorno (Opcional)</Label>
                    <Input id="expectedReturnDate" name="expectedReturnDate" type="date" defaultValue={editingConsignment?.expectedReturnDate ? new Date(editingConsignment.expectedReturnDate).toISOString().split('T')[0] : ""} />
                  </div>
                </div>

                <div className="space-y-3 bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[#0A244A] flex items-center gap-2">
                      <PackageSearch className="w-4 h-4" /> Avaliação das Peças ({Object.keys(selectedPieces).length} selecionadas)
                    </Label>
                    <button type="button" onClick={selectAllFiltered} className="text-xs font-medium text-[#1E5AA8] hover:underline cursor-pointer">
                      Selecionar Todos (Filtrados)
                    </button>
                  </div>
                  
                  <Input 
                    placeholder="Procurar peça por código ou nome..." 
                    value={searchPiece}
                    onChange={(e) => setSearchPiece(e.target.value)}
                    className="bg-white mb-2"
                  />
                  
                  <div className="h-64 overflow-y-auto border border-zinc-200 rounded-md bg-white p-2 space-y-1">
                    {filteredPieces.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                        Nenhuma peça encontrada.
                      </div>
                    ) : (
                      filteredPieces.map(piece => {
                        const isSelected = !!selectedPieces[piece.id];
                        const pieceState = selectedPieces[piece.id];

                        return (
                          <div key={piece.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isSelected ? (pieceState.status === 'ACCEPTED' ? 'bg-blue-50 border border-blue-100' : 'bg-rose-50 border border-rose-100') : 'hover:bg-zinc-50 border border-transparent'}`}>
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => togglePieceSelection(piece.id)} 
                                className="rounded border-zinc-300 w-4 h-4 text-[#1E5AA8] focus:ring-[#1E5AA8] cursor-pointer" 
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-[#0A244A]">{piece.code} - {piece.name}</span>
                                <span className="text-xs text-zinc-500">Custo: {formatCurrency(piece.purchasePrice)}</span>
                              </div>
                            </label>
                            
                            {isSelected && (
                              <select 
                                className={`text-xs border rounded p-1.5 focus:outline-none w-48 ${pieceState.status === 'REJECTED' ? 'border-rose-300 text-rose-800 bg-white' : 'border-zinc-200 text-zinc-700 bg-white'}`}
                                value={pieceState.status === 'REJECTED' ? pieceState.reason : 'ACCEPTED'}
                                onChange={(e) => updatePieceStatus(piece.id, e.target.value)}
                              >
                                <option value="ACCEPTED">✅ Aceita (Ficou na loja)</option>
                                <option value="Conserto">❌ Devolvida: Conserto</option>
                                <option value="Higienização">❌ Devolvida: Higienização</option>
                                <option value="Fora de Temporada">❌ Devolvida: Fora de Temp.</option>
                                <option value="Sem Interesse">❌ Devolvida: Sem Interesse</option>
                              </select>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="status" className="text-[#0A244A]">Status da Remessa</Label>
                  <select id="status" name="status" defaultValue={editingConsignment?.status || "ACTIVE"} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                    {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full mt-4 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white h-11 text-base shadow-sm" disabled={loading}>
                  {loading ? "A processar..." : (editingConsignment ? "Salvar Alterações" : "Criar Remessa com Avaliações")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!consignmentToDelete} onOpenChange={(val) => !val && setConsignmentToDelete(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-zinc-600 mt-3 text-base">
                  Tem certeza que deseja excluir esta remessa? O histórico e a ligação com as peças serão desfeitos.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setConsignmentToDelete(null)} disabled={loading}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer" onClick={confirmDelete} disabled={loading}>
                  {loading ? "A processar..." : "Sim, Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6">
        {consignments.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <Handshake className="w-12 h-12 text-[#1E5AA8]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0A244A]">Nenhuma remessa em andamento</h3>
            <p className="text-sm text-[#4B4B4B] max-w-sm mt-1">
              Crie a primeira remessa selecionando as peças para avaliação no parceiro.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Parceiro / Destino</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Avaliação (Itens levados)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consignments.map((consignment) => {
                const total = consignment.items.length;
                const accepted = consignment.items.filter(i => i.status === 'ACCEPTED').length;
                const rejected = total - accepted;

                return (
                  <TableRow key={consignment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-[#0A244A]">{consignment.store.name}</span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <StoreIcon className="w-3 h-3" /> Id: {consignment.id.substring(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-[#4B4B4B] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" /> 
                          E: {formatDate(consignment.startDate)}
                        </span>
                        <span className="text-xs text-zinc-500 ml-5">
                          R: <span className={!consignment.expectedReturnDate ? "italic" : "font-medium"}>
                            {formatDate(consignment.expectedReturnDate)}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-[#4B4B4B]">{total} peças levadas</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-1.5 py-0 text-[10px]">
                            {accepted} aceites
                          </Badge>
                          {rejected > 0 && (
                            <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-200 font-medium px-1.5 py-0 text-[10px] flex items-center gap-1">
                              <XCircle className="w-2.5 h-2.5" /> {rejected} devolvidas
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-medium px-2 py-0.5 text-xs ${STATUS_MAP[consignment.status].color}`}>
                        {STATUS_MAP[consignment.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEditClick(consignment)} className="p-2 text-zinc-400 hover:text-[#1E5AA8] hover:bg-blue-50 rounded-md transition-colors cursor-pointer" title="Editar Remessa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConsignmentToDelete(consignment.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer" title="Excluir Remessa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}