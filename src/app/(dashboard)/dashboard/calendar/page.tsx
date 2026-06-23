"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, PlusCircle, CheckCircle2, AlertCircle, Trash2, Pencil, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { getCalendarEventsAction, createCalendarEventAction, updateCalendarEventAction, deleteCalendarEventAction } from "@/app/actions/calendar.actions";

type DbEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  isAllDay: boolean;
  type: string;
};

const TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  TAREFA: { label: "Tarefa", color: "bg-blue-500 text-white", bg: "bg-blue-50 text-blue-800 border-blue-200" },
  A_FAZER: { label: "A Fazer", color: "bg-zinc-500 text-white", bg: "bg-zinc-100 text-zinc-800 border-zinc-200" },
  EVENTO: { label: "Evento", color: "bg-purple-500 text-white", bg: "bg-purple-50 text-purple-800 border-purple-200" },
  BAZAR: { label: "Bazar", color: "bg-[#F4C21A] text-[#0A244A]", bg: "bg-amber-50 text-amber-900 border-amber-200" },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function CalendarPage() {
  const mockCompanyId = "company-placeholder-id";

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [banner, setBanner] = useState({ show: false, message: "", type: "" });

  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const loadData = async () => {
    const data = await getCalendarEventsAction(mockCompanyId);
    setEvents(data as DbEvent[]);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      const data = await getCalendarEventsAction(mockCompanyId);
      if (isMounted) {
        setEvents(data as DbEvent[]);
        setPageLoading(false);
      }
    };
    fetchEvents();
    return () => { isMounted = false; };
  }, []);

  const showBanner = (message: string, type: "success" | "error") => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: "", type: "" }), 5000);
  };

  const handleCloseModal = (val: boolean) => {
    setOpen(val);
    if (!val) setEditingEvent(null);
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

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      startDate: combinedDate,
      isAllDay: !timeValue,
      type: formData.get("type") as string,
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
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(year, month, d));
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const d = new Date(e.startDate);
      return d.getDate() === date.getDate() &&
             d.getMonth() === date.getMonth() &&
             d.getFullYear() === date.getFullYear();
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
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl transition-all min-w-80 ${banner.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"}`}>
          {banner.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{banner.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A244A]">Agenda & Calendário</h1>
          <p className="text-[#4B4B4B] mt-1">Organize as tarefas internas, eventos de moda e lançamentos de bazares.</p>
        </div>

        <Dialog open={open} onOpenChange={handleCloseModal}>
          <DialogTrigger className="flex items-center justify-center gap-2 cursor-pointer bg-[#1E5AA8] hover:bg-[#103A73] text-white transition-colors shadow-sm h-10 px-4 rounded-md text-sm font-medium">
            <PlusCircle className="w-4 h-4" /> Novo Compromisso
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#0A244A]">{editingEvent ? "Editar Compromisso" : "Agendar Compromisso"}</DialogTitle>
              <DialogDescription className="text-[#4B4B4B]">Insira as informações de horários e locais do evento.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-[#0A244A]">Título do Compromisso</Label>
                <Input id="title" name="title" defaultValue={editingEvent?.title || ""} placeholder="Ex: Bazar de Outono, Lavagem do Lote 04..." required autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="eventDate" className="text-[#0A244A]">Data</Label>
                  <Input id="eventDate" name="eventDate" type="date" defaultValue={editingEvent ? new Date(editingEvent.startDate).toISOString().split('T')[0] : selectedDate.toISOString().split('T')[0]} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="eventTime" className="text-[#0A244A]">Hora (Vazio p/ Dia Todo)</Label>
                  <Input id="eventTime" name="eventTime" type="time" defaultValue={editingEvent && !editingEvent.isAllDay ? new Date(editingEvent.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ""} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="type" className="text-[#0A244A]">Tipo de Atividade</Label>
                <select id="type" name="type" defaultValue={editingEvent?.type || "TAREFA"} className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm" required>
                  {Object.entries(TYPE_MAP).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="text-[#0A244A]">Local / Endereço (Opcional)</Label>
                <Input id="location" name="location" defaultValue={editingEvent?.location || ""} placeholder="Ex: Loja Principal, Parque de Exposições..." />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-[#0A244A]">Descrição / Notas rápidas</Label>
                <Input id="description" name="description" defaultValue={editingEvent?.description || ""} placeholder="Ex: Levar araras extras e sacolas..." />
              </div>

              <Button type="submit" className="w-full bg-[#1E5AA8] hover:bg-[#103A73] text-white h-11 shadow-sm cursor-pointer" disabled={loading}>
                {loading ? "A processar..." : (editingEvent ? "Salvar Alterações" : "Confirmar Agendamento")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Painel Esquerdo: A Grade Mensal do Calendário */}
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
                      <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded truncate font-medium ${TYPE_MAP[e.type]?.bg || "bg-zinc-100"}`}>
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

        {/* Painel Direito: Lista de Compromissos do Dia Selecionado */}
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
                <div key={e.id} className={`border rounded-lg p-3 relative group transition-shadow hover:shadow-sm ${TYPE_MAP[e.type]?.bg}`}>
                  <div className="flex justify-between items-start gap-2 pr-12">
                    <h4 className="font-bold text-sm text-[#0A244A] leading-tight wrap-break-words">{e.title}</h4>
                  </div>
                  
                  {e.description && <p className="text-xs text-zinc-600 mt-1">{e.description}</p>}
                  
                  <div className="flex flex-col gap-1 mt-3 pt-2 border-t border-zinc-200/50 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {e.isAllDay ? "Dia Todo" : new Date(e.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {e.location && (
                      <span className="flex items-center gap-1 truncate" title={e.location}>
                        <MapPin className="w-3 h-3" /> {e.location}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-0.5 rounded-md border border-zinc-100">
                    <button onClick={() => { setEditingEvent(e); setOpen(true); }} className="p-1 text-zinc-500 hover:text-[#1E5AA8] rounded transition-colors cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEventToDelete(e.id)} className="p-1 text-zinc-500 hover:text-rose-600 rounded transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal de Confirmação de Exclusão */}
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