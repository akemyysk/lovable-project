import { useQuery } from "@tanstack/react-query";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Plus, CalendarClock, PalmtreeIcon, Target } from "lucide-react";
import { monthRange, toDateKey, toMonthKey } from "@/lib/date-utils";
import {
  fetchAllTasksBetween, fetchEventsBetween, fetchHabits,
  fetchHabitLogsBetween, fetchDayOffsBetween, fetchGoals,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "./task-dialog";
import { EventDialog } from "./event-dialog";
import { TaskItem } from "./task-item";
import { DayOffDialog } from "./day-off-dialog";
import { GoalsList } from "./goals-list";

import { Progress } from "@/components/ui/progress";

export function MonthView({ date, onSelectDay }: { date: Date; onSelectDay: (d: Date) => void }) {
  const { start, end, days } = monthRange(date);
  const gridStart = toDateKey(days[0]);
  const gridEnd = toDateKey(days[days.length - 1]);
  const monthStartKey = toDateKey(start);
  const monthEndKey = toDateKey(end);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-range", gridStart, gridEnd],
    queryFn: () => fetchAllTasksBetween(gridStart, gridEnd),
  });
  const { data: events = [] } = useQuery({
    queryKey: ["events", gridStart, gridEnd],
    queryFn: () => fetchEventsBetween(gridStart, gridEnd),
  });
  const { data: habits = [] } = useQuery({ queryKey: ["habits"], queryFn: fetchHabits });
  const { data: logs = [] } = useQuery({
    queryKey: ["habit-logs", monthStartKey, monthEndKey],
    queryFn: () => fetchHabitLogsBetween(monthStartKey, monthEndKey),
  });
  const { data: offs = [] } = useQuery({
    queryKey: ["day-offs", monthStartKey, monthEndKey],
    queryFn: () => fetchDayOffsBetween(monthStartKey, monthEndKey),
  });
  const { data: monthGoals = [] } = useQuery({
    queryKey: ["period_goals", "month", toMonthKey(date)],
    queryFn: () => fetchGoals("month", toMonthKey(date)),
  });

  const monthScopedTasks = tasks.filter((t) => t.scope === "month" && t.due_date && t.due_date >= monthStartKey && t.due_date <= monthEndKey);
  const monthEvents = events.filter((e) => e.event_date >= monthStartKey && e.event_date <= monthEndKey);
  const offSet = new Set(offs.map((o) => o.day_date));

  const todayKey = toDateKey(new Date());
  let scheduled = 0, done = 0;
  const monthDays = days.filter((d) => isSameMonth(d, date));
  monthDays.forEach((d) => {
    const k = toDateKey(d);
    if (k > todayKey) return;
    const dow = d.getDay();
    habits.forEach((h) => {
      if (!(h.weekdays as unknown as number[]).includes(dow)) return;
      const log = logs.find((l) => l.habit_id === h.id && l.log_date === k);
      if (log?.status === "done") { scheduled++; done++; }
      else if (log?.status === "missed") { scheduled++; }
      else if (k < todayKey) { scheduled++; }
    });
  });
  const pct = scheduled ? Math.round((done / scheduled) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl font-semibold capitalize">
          {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <DayOffDialog rangeStart={monthStartKey} rangeEnd={monthEndKey} trigger={
            <Button variant="outline" size="sm" className="btn-off">
              <PalmtreeIcon className="h-4 w-4 mr-1" />Folga
            </Button>
          } />
          <EventDialog defaultDate={monthStartKey} trigger={
            <Button variant="outline" size="sm" className="btn-event">
              <CalendarClock className="h-4 w-4 mr-1" />Compromisso
            </Button>
          } />

          <TaskDialog defaultScope="month" defaultDate={monthStartKey} trigger={
            <Button size="sm" className="btn-task"><Plus className="h-4 w-4 mr-1" />Tarefa</Button>
          } />
        </div>
      </div>

      <Card className="p-4 card-surface flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Desempenho do mês</span>
        <Progress value={pct} className="h-2 flex-1" />
        <span className="font-display text-lg font-semibold">{pct}%</span>
      </Card>

      <Card className="card-surface p-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground mb-2">
          {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => (
            <div key={d} className="text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const k = toDateKey(d);
            const inMonth = isSameMonth(d, date);
            const isToday = k === toDateKey(new Date());
            const isOff = offSet.has(k);
            const dTasks = tasks.filter((t) => t.due_date === k);
            const dEvents = events.filter((e) => e.event_date === k);
            return (
              <button key={k} onClick={() => onSelectDay(d)}
                className={`text-left min-h-[80px] p-2 rounded-lg border transition-colors ${
                  inMonth ? "bg-background hover:bg-muted/40" : "bg-muted/20 text-muted-foreground"
                } ${isToday ? "border-primary ring-1 ring-primary/40" : "border-transparent"} ${
                  isOff ? "bg-sky/40" : ""
                }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isToday ? "font-semibold text-primary" : ""}`}>{format(d, "d")}</span>
                  {isOff && <span className="text-[9px] uppercase text-off font-medium">Folga</span>}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dEvents.slice(0, 2).map((e) => (
                    <div key={e.id} className="text-[10px] truncate px-1 rounded text-event font-medium">{e.title}</div>
                  ))}
                  {dTasks.slice(0, 2 - Math.min(dEvents.length, 2)).map((t) => (
                    <div key={t.id} className="text-[10px] truncate px-1 text-task font-medium">{t.title}</div>
                  ))}
                  {(dTasks.length + dEvents.length) > 2 && (
                    <div className="text-[10px] text-muted-foreground">+{dTasks.length + dEvents.length - 2}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Metas do Mês */}
      <Card className="card-surface p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Metas do mês
        </h3>
        <GoalsList scope="month" periodKey={toMonthKey(date)} goals={monthGoals} />
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-surface p-4">
          <h3 className="font-medium mb-3">Tarefas do mês</h3>
          {monthScopedTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-3 py-2">
              ✨ Nenhuma tarefa pendente este mês.
            </p>
          ) : (
            <div className="space-y-1">
              {monthScopedTasks.map((t) => <TaskItem key={t.id} task={t} />)}
            </div>
          )}
        </Card>
        <Card className="card-surface p-4">
          <h3 className="font-medium mb-3">Compromissos do mês</h3>
          {monthEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-3 py-2">
              🌸 Que mês tranquilo!
            </p>
          ) : (
            <ul className="space-y-2">
              {monthEvents.map((e) => (
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
