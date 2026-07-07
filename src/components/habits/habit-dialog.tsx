import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, type Habit } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, Trash2 } from "lucide-react";

// Cor fixa para todos os hábitos (verde ciano)
const HABIT_COLOR = "hsl(175 70% 42%)";
const WEEKDAYS = [
  { i: 0, l: "D" }, { i: 1, l: "S" }, { i: 2, l: "T" }, { i: 3, l: "Q" },
  { i: 4, l: "Q" }, { i: 5, l: "S" }, { i: 6, l: "S" },
];
const PERIODS: { value: "morning" | "afternoon" | "evening" | "none"; label: string }[] = [
  { value: "morning", label: "Manhã" },
  { value: "afternoon", label: "Tarde" },
  { value: "evening", label: "Noite" },
  { value: "none", label: "Sem período" },
];

export function HabitDialog({
  trigger, habit, defaultPeriod,
}: {
  trigger: React.ReactNode;
  habit?: Habit;
  defaultPeriod?: "morning" | "afternoon" | "evening" | "none";
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(habit?.name ?? "");
  const color = habit?.color ?? HABIT_COLOR;
  const [weekdays, setWeekdays] = useState<number[]>(
    (habit?.weekdays as unknown as number[]) ?? [0, 1, 2, 3, 4, 5, 6],
  );
  const [period, setPeriod] = useState<"morning" | "afternoon" | "evening" | "none">(
    (habit?.period as "morning" | "afternoon" | "evening" | "none" | null) ?? defaultPeriod ?? "none",
  );
  const [reminderTime, setReminderTime] = useState<string>(
    (habit?.reminder_time ?? "").toString().slice(0, 5),
  );

  const save = useMutation({
    mutationFn: async () => {
      const user_id = await currentUserId();
      const payload: Record<string, unknown> = {
        user_id, name, color, weekdays, frequency: "daily",
        period: period === "none" ? null : period,
        reminder_time: reminderTime ? reminderTime : null,
      };
      if (reminderTime && "Notification" in window && Notification.permission === "default") {
        try { await Notification.requestPermission(); } catch {}
      }
      const table = supabase.from("habits") as unknown as {
        insert: (v: unknown) => Promise<{ error: unknown }>;
        update: (v: unknown) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
      };
      if (habit) {
        const { error } = await table.update(payload).eq("id", habit.id);
        if (error) throw error;
      } else {
        const { error } = await table.insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success(habit ? "Hábito atualizado" : "Hábito criado");
      setOpen(false);
      if (!habit) setName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!habit) return;
      const { error } = await supabase.from("habits").update({ archived: true }).eq("id", habit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito removido");
      setOpen(false);
    },
  });

  const toggleDay = (i: number) =>
    setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{habit ? "Editar hábito" : "Novo hábito"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Meditar 10min" />
          </div>
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <button key={p.value} type="button" onClick={() => setPeriod(p.value)}
                  className={`px-3 h-8 rounded-full text-xs font-medium transition-colors ${
                    period === p.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>{p.label}</button>
              ))}
            </div>
          </div>
          {/* Cores automáticas: hábitos usam sempre verde ciano. */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Bell className="h-3.5 w-3.5" /> Horário (opcional)</Label>
            <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">
              Se definido, você receberá uma notificação neste horário.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Dias da semana</Label>
            <div className="flex gap-2">
              {WEEKDAYS.map((d) => (
                <button key={d.i} type="button" onClick={() => toggleDay(d.i)}
                  className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                    weekdays.includes(d.i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>{d.l}</button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {habit ? (
            <Button variant="ghost" size="sm" className="text-destructive"
              onClick={() => del.mutate()}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={!name || save.isPending}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
