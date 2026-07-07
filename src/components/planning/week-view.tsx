import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Plus, CalendarClock, PalmtreeIcon } from "lucide-react";
import { toDateKey, weekRange, toWeekKey } from "@/lib/date-utils";
import {
  fetchAllTasksBetween, fetchEventsBetween, fetchHabits,
  fetchHabitLogsBetween, fetchDayOffsBetween,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./task-item";
import { TaskDialog } from "./task-dialog";
import { EventDialog } from "./event-dialog";
import { DayOffDialog } from "./day-off-dialog";
import { Progress } from "@/components/ui/progress";

export function WeekView({ date }: { date: Date }) {
  const { start, end, days } = weekRange(date);
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-range", startKey, endKey],
    queryFn: () => fetchAllTasksBetween(startKey, endKey),
  });
  const { data: events = [] } = useQuery({
    queryKey: ["events", startKey, endKey],
    queryFn: () => fetchEventsBetween(startKey, endKey),
  });
  const { data: habits = [] } = useQuery({ queryKey: ["habits"], queryFn: fetchHabits });
  const { data: logs = [] } = useQuery({
    queryKey: ["habit-logs", startKey, endKey],
    queryFn: () => fetchHabitLogsBetween(startKey, endKey),
  });
  const { data: offs = [] } = useQuery({
    queryKey: ["day-offs", startKey, endKey],
    queryFn: () => fetchDayOffsBetween(startKey, endKey),
  });

  const weekTasks = tasks.filter((t) => t.scope === "week");
  const weekEvents = events;

  // Percentagem semanal: baseada em (done+missed) sobre programados
  const todayKey = toDateKey(new Date());
  let scheduled = 0, done = 0;
  days.forEach((d) => {
    const k = toDateKey(d);
    if (k > todayKey) return;
    const dow = d.getDay();
    habits.forEach((h) => {
      const applies = (h.weekdays as unknown as number[]).includes(dow);
      if (!applies) return;
      const log = logs.find((l) => l.habit_id === h.id && l.log_date === k);
      if (log?.status === "done") { scheduled++; done++; }
      else if (log?.status === "missed") { scheduled++; }
      else if (k < todayKey) { scheduled++; } // Não iniciado em dia passado conta como missed
    });
  });
  const pct = scheduled ? Math.round((done / scheduled) * 100) : 0;

  const offSet = new Set(offs.map((o) => o.day_date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl font-semibold">
          Semana de {format(start, "d 'de' MMM", { locale: ptBR })} — {format(end, "d 'de' MMM", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <DayOffDialog rangeStart={startKey} rangeEnd={endKey} trigger={
            <Button variant="outline" size="sm" className="btn-off">
              <PalmtreeIcon className="h-4 w-4 mr-1" />Folga
            </Button>
          } />
          <EventDialog defaultDate={startKey} trigger={
            <Button variant="outline" size="sm" className="btn-event">
              <CalendarClock className="h-4 w-4 mr-1" />Compromisso
            </Button>
          } />

          <TaskDialog defaultScope="week" defaultDate={startKey} trigger={
            <Button size="sm" className="btn-task"><Plus className="h-4 w-4 mr-1" />Tarefa</Button>
          } />
        </div>
      </div>

      <Card className="p-4 card-surface flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Desempenho da semana</span>
        <Progress value={pct} className="h-2 flex-1" />
        <span className="font-display text-lg font-semibold">{pct}%</span>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        {days.map((d) => {
          const k = toDateKey(d);
          const dTasks = tasks.filter((t) => t.due_date === k && t.scope === "day");
          const dEvents = events.filter((e) => e.event_date === k);
          const isToday = k === toDateKey(new Date());
          const isOff = offSet.has(k);
          return (
            <Card key={k} className={`p-3 card-surface min-h-[160px] ${isToday ? "ring-2 ring-primary/40" : ""} ${isOff ? "bg-sky/40" : ""}`}>
              <div className="mb-2">
                <p className="text-xs uppercase text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</p>
                <p className="font-display text-lg">{format(d, "d")}</p>
                {isOff && <p className="text-[10px] uppercase text-off font-medium">Folga</p>}
              </div>
              <div className="space-y-1">
                {dEvents.map((e) => (
                  <div key={e.id} className="text-xs px-2 py-1 rounded truncate bg-destructive/10 text-event font-medium">
                    {e.start_time ? "🕒 " + e.start_time.slice(0,5) + " " : ""}{e.title}
                  </div>
                ))}
                {dTasks.map((t) => (
                  <div key={t.id} className={`text-xs px-2 py-1 rounded truncate font-medium ${
                    t.status === "done" ? "line-through text-muted-foreground" :
                    t.status === "missed" ? "line-through text-muted-foreground/70" :
                    "text-task bg-primary/5"
                  }`}>{t.due_time ? "🕒 " + t.due_time.slice(0,5) + " " : ""}{t.title}</div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-surface p-4">
          <h3 className="font-medium mb-3">Tarefas da semana</h3>
          {weekTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-3 py-2">
              ✨ Nenhuma tarefa pendente esta semana.
            </p>
          ) : (
            <div className="space-y-1">
              {weekTasks.map((t) => <TaskItem key={t.id} task={t} />)}
            </div>
          )}
        </Card>
        <Card className="card-surface p-4">
          <h3 className="font-medium mb-3">Compromissos da semana</h3>
          {weekEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-3 py-2">
              🌸 Que semana tranquila!
            </p>
          ) : (
            <ul className="space-y-2">
              {weekEvents.map((e) => (
                <li key={e.id} className="flex items-baseline gap-2 text-sm">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">
                    {format(new Date(e.event_date + "T00:00:00"), "dd/MM")}
                  </span>
                  <span className="text-event font-medium flex-1">{e.title}</span>
                  {e.start_time && <span className="text-xs text-muted-foreground">🕒 {e.start_time.slice(0,5)}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
