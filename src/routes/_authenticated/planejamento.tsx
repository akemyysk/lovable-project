import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DayView } from "@/components/planning/day-view";
import { WeekView } from "@/components/planning/week-view";
import { MonthView } from "@/components/planning/month-view";
import { relativeDayLabel } from "@/lib/date-utils";

type ViewMode = "day" | "week" | "month";

export const Route = createFileRoute("/_authenticated/planejamento")({
  component: PlanejamentoPage,
});

function PlanejamentoPage() {
  const [view, setView] = useState<ViewMode>("day");
  const [date, setDate] = useState<Date>(new Date());

  const navigate = (dir: -1 | 1) => {
    if (view === "day") setDate(dir === 1 ? addDays(date, 1) : subDays(date, 1));
    else if (view === "week") setDate(dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1));
    else setDate(dir === 1 ? addMonths(date, 1) : subMonths(date, 1));
  };

  const rel = view === "day" ? relativeDayLabel(date) : null;

  const label =
    view === "day"
      ? (rel ? `${rel} · ${format(date, "d 'de' MMM", { locale: ptBR })}` : format(date, "d 'de' MMM 'de' yyyy", { locale: ptBR }))
      : view === "week"
      ? format(date, "'Semana de' d 'de' MMM", { locale: ptBR })
      : format(date, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-start capitalize">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)}
                initialFocus className="pointer-events-auto p-3" locale={ptBR} />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "day" && <DayView date={date} />}
      {view === "week" && <WeekView date={date} />}
      {view === "month" && <MonthView date={date} onSelectDay={(d) => { setDate(d); setView("day"); }} />}
    </div>
  );
}
