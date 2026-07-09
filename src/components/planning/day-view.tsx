import type { CSSProperties } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Sun, Cloud, Moon, Plus, CalendarClock, Repeat, Pin, Check } from "lucide-react";
import { toDateKey, relativeDayLabel } from "@/lib/date-utils";
import { fetchTasksByDate, fetchEventsBetween, type Event as EventRow } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./task-item";
import { TaskDialog } from "./task-dialog";
import { EventDialog } from "./event-dialog";
import { DayHabits } from "./day-habits";
import { HabitDialog } from "@/components/habits/habit-dialog";

const PERIODS = [
  { key: "morning", label: "Manhã", icon: Sun, accent: "hsl(48 90% 55%)", darkAccent: "hsl(165 70% 45%)" },
  { key: "afternoon", label: "Tarde", icon: Cloud, accent: "hsl(200 85% 55%)", darkAccent: "hsl(165 70% 45%)" },
  { key: "evening", label: "Noite", icon: Moon, accent: "hsl(270 55% 60%)", darkAccent: "hsl(165 70% 45%)" },
] as const;


type EventWithPeriod = EventRow & { period?: string | null };

function EventItem({ event }: { event: EventWithPeriod }) {
  const qc = useQueryClient();
  const isDone = (event as { completed?: boolean }).completed === true;

  const toggle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .update({ completed: !isDone } as never)
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  return (
    <div className="w-full text-left flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <button
        type="button"
        onClick={() => toggle.mutate()}
        className="shrink-0"
        aria-label="Alternar conclusão do compromisso"
      >
        {isDone ? (
          <span className="h-4 w-4 rounded-sm bg-[hsl(0_78%_50%)] text-white grid place-items-center">
            <Check className="h-3 w-3" />
          </span>
        ) : (
          <span className="h-4 w-4 rounded-sm border-2 border-[hsl(0_78%_50%)]/60 block" />
        )}
      </button>
      <EventDialog event={event} trigger={
        <button className="flex-1 min-w-0 text-left">
          <span className="h-3 w-3 shrink-0 rounded-full bg-[hsl(0_78%_50%)] inline-block mr-2 align-middle" />
          <span className={`text-sm font-medium text-event align-middle ${isDone ? "line-through text-muted-foreground" : ""}`}>
            {event.title}
          </span>
          {(event.start_time || event.location) && (
            <p className="text-xs text-muted-foreground truncate">
              {event.start_time ? `🕒 ${event.start_time.slice(0,5)}${event.end_time ? " – " + event.end_time.slice(0,5) : ""}` : ""}
              {event.location ? (event.start_time ? " · " : "") + event.location : ""}
            </p>
          )}
        </button>
      } />
    </div>
  );
}

export function DayView({ date }: { date: Date }) {
  const key = toDateKey(date);
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", key], queryFn: () => fetchTasksByDate(key) });
  const { data: events = [] } = useQuery({
    queryKey: ["events", key, key], queryFn: () => fetchEventsBetween(key, key),
  });

  const eventsTyped = events as EventWithPeriod[];
  const tasksByPeriod = (p: string) => tasks.filter((t) => (t.period ?? "none") === p);
  const eventsByPeriod = (p: string) => eventsTyped.filter((e) => (e.period ?? "morning") === p);
  const tasksNoPeriod = tasks.filter((t) => !t.period);

  const rel = relativeDayLabel(date);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          {rel && <span className="text-xs px-2 py-0.5 rounded-full bg-sky/40 text-sky-foreground font-medium mr-2">{rel}</span>}
          <h2 className="font-display text-2xl font-semibold capitalize inline">
            {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <EventDialog defaultDate={key} trigger={
            <Button size="sm" className="btn-event">
              <CalendarClock className="h-4 w-4 mr-1" />Compromisso
            </Button>
          } />
          <HabitDialog trigger={
            <Button size="sm" className="btn-habit">
              <Repeat className="h-4 w-4 mr-1" />Hábito
            </Button>
          } />
          <TaskDialog defaultDate={key} defaultScope="day" trigger={
            <Button size="sm" className="btn-task">
              <Plus className="h-4 w-4 mr-1" />Tarefa
            </Button>
          } />
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PERIODS.map(({ key: pk, label, icon: Icon, accent, darkAccent }) => {
          const periodTasks = tasksByPeriod(pk);
          const periodEvents = eventsByPeriod(pk);
          const isEmpty = periodTasks.length === 0 && periodEvents.length === 0;
          return (
            <Card key={pk} className="card-surface p-4 period-band" style={{ "--band": accent, "--band-dark": darkAccent } as CSSProperties}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 period-icon" />
                  <h3 className="font-medium">{label}</h3>
                </div>

                <HabitDialog defaultPeriod={pk} trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Repeat className="h-3.5 w-3.5" />
                  </Button>
                } />
              </div>
              <div className="space-y-1 min-h-[80px]">
                <DayHabits date={date} period={pk} />
                {periodEvents.map((e) => <EventItem key={e.id} event={e} />)}
                {periodTasks.map((t) => <TaskItem key={t.id} task={t} />)}
                {isEmpty && (
                  <p className="text-xs text-muted-foreground italic px-3 py-2">Sem itens.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="card-surface p-4 period-band" style={{ "--band": "hsl(224 85% 35%)", "--band-dark": "hsl(165 70% 45%)" } as CSSProperties}>
        <div className="flex items-center gap-2 mb-3">
          <Pin className="h-4 w-4 period-icon" />
          <h3 className="font-medium">Sem período definido</h3>
        </div>
        <div className="space-y-1">
          <DayHabits date={date} period="none" />
          {tasksNoPeriod.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-3 py-2">Nenhuma tarefa sem período.</p>
          ) : (
            tasksNoPeriod.map((t) => <TaskItem key={t.id} task={t} />)
          )}
        </div>
      </Card>
    </div>
  );
}
