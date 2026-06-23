"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, PlusCircle, CheckCircle2, AlertCircle, Trash2, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { getCalendarPageDataAction, createCalendarEventAction, updateCalendarEventAction, deleteCalendarEventAction, updateEventDateAction } from "@/app/actions/calendar.actions";

type DbEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  isAllDay: boolean;
  type: string;
};

type BasicStore = { id: string; name: string; address: string | null };
type BasicLot = { id: string; code: string; sourceName: string };
type BasicSupplier = { name: string };

const DEFAULT_TYPES = ["Bazar", "Lavagem de Lote", "Ida ao Parceiro", "Manutenção das Peças", "Postar Peças"];

const TYPE_STYLES: Record<string, { bg: string }> = {
  "Bazar": { bg: "bg-amber-50 text-amber-900 border-amber-200" },
  "Lavagem de Lote": { bg: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  "Ida ao Parceiro": { bg: "bg-purple-50 text-purple-800 border-purple-200" },
  "Manutenção das Peças": { bg: "bg-rose-50 text-rose-800 border-rose-200" },
  "Postar Peças": { bg: "bg-lime-50 text-lime-800 border-lime-200" },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function CalendarPage() {
  const mockCompanyId = "company-placeholder-id";

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [stores, setStores] = useState<BasicStore[]>([]);
  const [lots, setLots] = useState<BasicLot[]>([]);
  const [suppliers, setSuppliers] = useState<BasicSupplier[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>(DEFAULT_TYPES);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState("Bazar");
  const [partnerMode, setPartnerMode] = useState("NONE"); 
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedSupplierName, setSelectedSupplierName] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [selectedLotId, setSelectedLotId] = useState("");
  const [customInputInfo, setCustomInputInfo] = useState("");

  const loadData = async () => {
    const result = await getCalendarPageDataAction(mockCompanyId);
    if (result.success) {
      setEvents(result.events as DbEvent[]);
      setStores(result.stores);
      setLots(result.lots);
      setSuppliers(result.suppliers);
      setEventTypes(Array.from(new Set([...DEFAULT_TYPES, ...result.dynamicTypes])));
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      const result = await getCalendarPageDataAction(mockCompanyId);
      if (isMounted && result.success) {
        setEvents(result.events as DbEvent[]);
        setStores(result.stores);
        setLots(result.lots);
        setSuppliers(result.suppliers);
        setEventTypes(Array.from(new Set([...DEFAULT_TYPES, ...result.dynamicTypes])));
        setPageLoading(false);
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleEditClick = (e: DbEvent) => {
    setEditingEvent(e);
    setSelectedType(e.type);
    setOpen(true);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setEditingEvent(null);
      setSelectedType("Bazar");
      setPartnerMode("NONE");
      setSelectedStoreId("");
      setSelectedSupplierName("");
      setManualLocation("");
      setSelectedLotId("");
      setCustomInputInfo("");
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    if (!eventId) return;

    setLoading(true);
    const result = await updateEventDateAction(eventId, mockCompanyId, targetDate);
    setLoading(false);

    if (result.success) {
      showBanner("Compromisso movido com sucesso!", "success");
      await loadData();
    } else {
      showBanner(result.error || "Erro ao mover compromisso.", "error");
    }
  };

  const handleTypeChange = (val: string) => {
    if (val === "NEW") {
      const newType = window.prompt("Digite o nome da nova categoria de atividade:");
      if (newType && newType.trim() !== "") {
        setEventTypes(prev => [...prev, newType.trim()]);
        setSelectedType(newType.trim());
      } else {
        setSelectedType("Bazar");
      }
    } else {
      setSelectedType(val);
      if (val === "Ida ao Parceiro") setPartnerMode("STORE");
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const timeValue = formData.get("eventTime") as string;
    const dateStr = formData.get("eventDate") as string;
    const combinedDate = new Date(`${dateStr}T${timeValue || "00:00"}:00`);

    let partnerName = "";
    let locationString = "Não definido";

    if (partnerMode === "STORE" && selectedStoreId) {
      const targetStore = stores.find(s => s.id === selectedStoreId);
      if (targetStore) {
        partnerName = targetStore.name;
        locationString = `🏬 Loja: ${targetStore.name} ${targetStore.address ? `(${targetStore.address})` : ""}`;
      }
    } else if (partnerMode === "SUPPLIER" && selectedSupplierName) {
      partnerName = selectedSupplierName;
      locationString = `📦 Fornecedor: ${selectedSupplierName}`;
    } else if (partnerMode === "MANUAL" && manualLocation) {
      locationString = manualLocation;
    }

    const autoTitle = partnerName 
      ? `${selectedType} - ${partnerName}` 
      : manualLocation 
        ? `${selectedType} - ${manualLocation}` 
        : selectedType;

    let finalDescription = formData.get("description") as string;
    if (selectedType === "Lavagem de Lote" && selectedLotId) {
      const targetLot = lots.find(l => l.id === selectedLotId);
      if (targetLot) finalDescription = `[Lote: ${targetLot.code} - ${targetLot.sourceName}] | ${finalDescription}`;
    }
    if ((selectedType === "Postar Peças" || selectedType === "Manutenção das Peças") && customInputInfo) {
      finalDescription = `[Ref: ${customInputInfo}] | ${finalDescription}`;
    }

    const data = {
      title: autoTitle,
      description: finalDescription,
      location: locationString,
      startDate: combinedDate,
      isAllDay: !timeValue,
      type: selectedType,
    };

    let result;
    if (editingEvent) {
      result = await updateCalendarEventAction(editingEvent.id, mockCompanyId, data);
    } else {
      result = await createCalendarEventAction(mockCompanyId, data);
    }

    setLoading(false);
    if (result.success) {
      handleCloseModal(false);
      showBanner(editingEvent ? "Compromisso atualizado!" : "Compromisso agendado com sucesso!", "success");
      await loadData();
    } else {
      showBanner(result.error || "Erro ao salvar.", "error");
    }
  }

  async function confirmDelete() {
    if (!eventToDelete) return;
    setLoading(true);
    const result = await deleteCalendarEventAction(eventToDelete, mockCompanyId);
    setLoading(false);
    if (result.success) {
      showBanner("Compromisso removido!", "success");
      setEventToDelete(null);
      await loadData();
    } else {
      showBanner(result.error || "Erro ao remover.", "error");
    }
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const calendarCells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(new Date(year, month, d));

  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const d = new Date(e.startDate);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  if (pageLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500 font-medium animate-pulse">A carregar cronogramas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {banner.show && (
        <div className={`fixed top-6 right-6 z-100 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl transition-all min-w-80 ${banner.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Agenda &amp; Calendário</h1>
          <p className="text-[#4B4B4B] mt-1">Gestão inteligente de prazos, ações integradas e bazares de moda.</p>
        </div>

        <Dialog open={open} onOpenChange={handleCloseModal}>
          <DialogTrigger className="flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
            <PlusCircle className="w-4 h-4" /> Novo Compromisso
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#0A244A]">{editingEvent ? "Editar Atividade" : "Agendar Atividade"}</DialogTitle>
              <DialogDescription className="text-[#4B4B4B]">O título será composto automaticamente com base no tipo e parceiro.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="type" className="text-[#0A244A]">Tipo de Atividade</Label>
                <select id="type" value={selectedType} onChange={(e) => handleTypeChange(e.target.value)} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="NEW" className="font-bold text-[#1E5AA8]">+ Criar Customizada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="eventDate" className="text-[#0A244A]">Data</Label>
                  <Input id="eventDate" name="eventDate" type="date" defaultValue={editingEvent ? new Date(editingEvent.startDate).toISOString().split('T')[0] : selectedDate.toISOString().split('T')[0]} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="eventTime" className="text-[#0A244A]">Horário (Opcional)</Label>
                  <Input id="eventTime" name="eventTime" type="time" defaultValue={editingEvent && !editingEvent.isAllDay ? new Date(editingEvent.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ""} />
                </div>
              </div>

              {selectedType === "Lavagem de Lote" && (
                <div className="space-y-1 bg-cyan-50/50 p-3 border border-cyan-200 rounded-md">
                  <Label className="text-cyan-900 font-semibold">Vincular Lote de Origem</Label>
                  <select value={selectedLotId} onChange={(e) => setSelectedLotId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-cyan-200 bg-white text-sm" required>
                    <option value="">Selecione qual lote vai para lavagem...</option>
                    {lots.map(l => (
                      <option key={l.id} value={l.id}>{l.sourceName} ({l.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedType === "Postar Peças" || selectedType === "Manutenção das Peças") && (
                <div className="space-y-1 bg-zinc-50 p-3 border border-zinc-200 rounded-md">
                  <Label className="text-[#0A244A] font-semibold">
                    {selectedType === "Postar Peças" ? "Código de Rastreio" : "SKUs das Peças"}
                  </Label>
                  <Input value={customInputInfo} onChange={(e) => setCustomInputInfo(e.target.value)} placeholder={selectedType === "Postar Peças" ? "Ex: BR123456789XL" : "Ex: AM-109, AM-443"} />
                </div>
              )}

              <div className="space-y-2 border-t border-zinc-100 pt-3">
                <Label className="text-[#0A244A] font-semibold">Definir Parceiro / Local</Label>
                <div className="flex flex-wrap gap-3 mb-2 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={partnerMode === "NONE"} onChange={() => setPartnerMode("NONE")} /> Sem Parceiro
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={partnerMode === "STORE"} onChange={() => setPartnerMode("STORE")} /> Loja (Consignação)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={partnerMode === "SUPPLIER"} onChange={() => setPartnerMode("SUPPLIER")} /> Fornecedor (Compra)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={partnerMode === "MANUAL"} onChange={() => setPartnerMode("MANUAL")} /> Local Manual
                  </label>
                </div>

                {partnerMode === "STORE" && (
                  <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-purple-200 bg-white text-sm" required>
                    <option value="">Selecione a loja consignatária...</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}

                {partnerMode === "SUPPLIER" && (
                  <select value={selectedSupplierName} onChange={(e) => setSelectedSupplierName(e.target.value)} className="w-full h-10 px-3 rounded-md border border-amber-200 bg-white text-sm" required>
                    <option value="">Selecione o fornecedor...</option>
                    {suppliers.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                )}

                {partnerMode === "MANUAL" && (
                  <Input value={manualLocation} onChange={(e) => setManualLocation(e.target.value)} placeholder="Ex: Escritório, Shopping, Feira..." required />
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-[#0A244A]">Observações Adicionais</Label>
                <Input id="description" name="description" defaultValue={editingEvent?.description?.split(" | ").pop() || ""} placeholder="Ex: Levar fita métrica e etiquetas..." />
              </div>

              <Button type="submit" className="w-full bg-[#1E5AA8] hover:bg-[#103A73] text-white h-11 cursor-pointer" disabled={loading}>
                {loading ? "A processar..." : (editingEvent ? "Salvar Alterações" : "Confirmar Agendamento")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Painel Esquerdo: Grade Mensal Interativa */}
        <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0A244A]">
              {MONTHS[month]} <span className="text-zinc-400 font-normal">{year}</span>
            </h2>
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-md transition-colors cursor-pointer text-zinc-600"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-md transition-colors cursor-pointer text-zinc-600"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center font-semibold text-zinc-500 text-sm mb-2">
            {WEEKDAYS.map(day => <div key={day} className="py-2">{day}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1 border-t border-zinc-100 pt-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="h-24 bg-zinc-50/50 rounded-md border border-transparent" />;
              
              const dayEvents = getEventsForDate(cell);
              const isSelected = cell.getDate() === selectedDate.getDate() && cell.getMonth() === selectedDate.getMonth() && cell.getFullYear() === selectedDate.getFullYear();
              const isToday = cell.getDate() === new Date().getDate() && cell.getMonth() === new Date().getMonth() && cell.getFullYear() === new Date().getFullYear();

              return (
                <div 
                  key={cell.toISOString()} 
                  onClick={() => setSelectedDate(cell)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, cell)}
                  className={`h-24 rounded-lg border p-1.5 flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected ? 'border-[#1E5AA8] bg-blue-50/30 ring-1 ring-[#1E5AA8]' : 'border-zinc-200 hover:bg-zinc-50 bg-white'
                  }`}
                >
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-[#1E5AA8] text-white' : isSelected ? 'text-[#1E5AA8]' : 'text-zinc-700'
                  }`}>
                    {cell.getDate()}
                  </span>
                  
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(e => (
                      <div 
                        key={e.id} 
                        draggable
                        onDragStart={(evt) => handleDragStart(idx === 0 ? evt : evt, e.id)}
                        onClick={(evt) => { evt.stopPropagation(); handleEditClick(e); }}
                        className={`text-[10px] px-1 py-0.5 rounded truncate font-medium cursor-grab active:cursor-grabbing border shadow-2xs transition-transform hover:scale-[1.02] ${TYPE_STYLES[e.type]?.bg || "bg-zinc-50 border-zinc-200 text-zinc-700"}`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-zinc-400 font-bold ml-1">+{dayEvents.length - 2} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel Direito: Agenda Sidebar */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-xl shadow-sm p-5 flex flex-col h-125">
          <div className="border-b border-zinc-100 pb-4 mb-4">
            <h3 className="font-bold text-[#0A244A] text-lg">Agenda do Dia</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {selectedDateEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CalendarIcon className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="text-xs text-zinc-400 italic">Nenhum compromisso marcado para este dia.</p>
              </div>
            ) : (
              selectedDateEvents.map(e => (
                <div 
                  key={e.id} 
                  onClick={() => handleEditClick(e)}
                  className={`border rounded-lg p-3 relative group transition-all hover:shadow-sm cursor-pointer border-l-4 ${TYPE_STYLES[e.type]?.bg || "bg-zinc-50 border-zinc-200 text-zinc-800"}`}
                >
                  <div className="flex justify-between items-start gap-2 pr-6">
                    <h4 className="font-bold text-sm text-[#0A244A] leading-tight wrap-break-word">{e.title}</h4>
                  </div>
                  
                  {e.description && <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{e.description}</p>}
                  
                  <div className="flex flex-col gap-1 mt-3 pt-2 border-t border-zinc-200/50 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {e.isAllDay ? "Dia Todo" : new Date(e.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {e.location && e.location !== "Não definido" && (
                      <span className="flex items-center gap-1 truncate" title={e.location}>
                        <MapPin className="w-3 h-3" /> {e.location}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-0.5 rounded border border-zinc-100">
                    <button onClick={(evt) => { evt.stopPropagation(); setEventToDelete(e.id); }} className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer" title="Remover Atividade"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <Dialog open={!!eventToDelete} onOpenChange={(v) => !v && setEventToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Cancelar Compromisso
            </DialogTitle>
            <DialogDescription className="text-zinc-600 mt-2 text-sm">
              Tem certeza de que deseja remover este compromisso da sua agenda? A exclusão é definitiva.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setEventToDelete(null)} disabled={loading}>Manter</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer" onClick={confirmDelete} disabled={loading}>
              {loading ? "A processar..." : "Sim, Cancelar"}
            </Button>
          </div>
        </DialogContent>    
      </Dialog>
    </div>
  );
}