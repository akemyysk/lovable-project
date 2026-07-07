import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchHabits, fetchHabitLogsBetween, currentUserId } from "@/lib/queries";
import { toDateKey } from "@/lib/date-utils";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { HabitDialog } from "@/components/habits/habit-dialog";

type Period = "morning" | "afternoon" | "evening" | "none";

export function DayHabits({ date, period }: { date: Date; period?: Period }) {
  const dow = date.getDay();
  const key = toDateKey(date);
  const qc = useQueryClient();

  const { data: habits = [] } = useQuery({ queryKey: ["habits"], queryFn: fetchHabits });
  const { data: logs = [] } = useQuery({
    queryKey: ["habit-logs", key],
    queryFn: () => fetchHabitLogsBetween(key, key),
  });

  const applicable = habits.filter((h) => {
    const dayOk = h.frequency !== "daily" || (h.weekdays as unknown as number[]).includes(dow);
    if (!dayOk) return false;
    if (!period) return true;
    const hp = (h.period ?? "none") as Period;
    return hp === period;
  });

  const setLog = useMutation({
    mutationFn: async ({ habitId, status }: { habitId: string; status: "done" | "missed" | null }) => {
      const user_id = await currentUserId();
      const existing = logs.find((l) => l.habit_id === habitId);
      if (status === null) {
        if (existing) {
          const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
          if (error) throw error;
        }
        return;
      }
      if (existing) {
        const { error } = await supabase.from("habit_logs").update({ status }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("habit_logs").insert({
          user_id, habit_id: habitId, log_date: key, status,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habit-logs"] }),
  });

  if (applicable.length === 0) return null;

  return (
    <div className="space-y-1">
      {applicable.map((h) => {
        const log = logs.find((l) => l.habit_id === h.id);
        const state: "none" | "done" | "missed" =
          log?.status === "done" ? "done" : log?.status === "missed" ? "missed" : "none";
        const cycle = () => {
          const next = state === "none" ? "done" : state === "done" ? "missed" : null;
          setLog.mutate({ habitId: h.id, status: next as "done" | "missed" | null });
        };
        return (
          <motion.div layout key={h.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 bg-muted/20 group">
            <button type="button" onClick={cycle} className="shrink-0" aria-label="Alternar estado do hábito">
              {state === "done" ? (
                <span className="h-4 w-4 rounded-sm grid place-items-center text-white bg-[hsl(200,85%,45%)]">
                  <Check className="h-3 w-3" />
                </span>
              ) : state === "missed" ? (
                <span className="h-4 w-4 rounded-sm bg-muted-foreground/30 text-foreground/60 grid place-items-center">
                  <X className="h-3 w-3" />
                </span>
              ) : (
                <span className="h-4 w-4 rounded-sm border-2 border-[hsl(200,85%,45%)]/60 block" />
              )}
            </button>
            <HabitDialog habit={h} trigger={
              <button className="text-left flex-1 min-w-0">
                <span className={`text-sm font-medium text-habit ${
                  state === "done" ? "line-through text-muted-foreground!" :
                  state === "missed" ? "text-muted-foreground!" : ""
                }`}>
                  {h.name}
                </span>
              </button>
            } />
            {h.reminder_time && (
              <span className="text-[10px] text-muted-foreground">
                🕒 {String(h.reminder_time).slice(0,5)}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
