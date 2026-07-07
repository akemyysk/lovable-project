import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, type Goal, type GoalMilestone } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoalDialog } from "./goal-dialog";
import { Pencil, Plus, CalendarClock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

interface Props {
  goal: Goal;
  milestones: GoalMilestone[];
}

export function GoalCard({ goal, milestones }: Props) {
  const qc = useQueryClient();
  const [newMilestone, setNewMilestone] = useState("");
  const [adding, setAdding] = useState(false);

  const doneCount = milestones.filter((m) => m.done).length;
  const derivedPct = milestones.length
    ? Math.round((doneCount / milestones.length) * 100)
    : goal.progress;

  const toggleMilestone = useMutation({
    mutationFn: async (m: GoalMilestone) => {
      const { error } = await supabase.from("goal_milestones")
        .update({ done: !m.done }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });

  const addMilestone = useMutation({
    mutationFn: async () => {
      if (!newMilestone.trim()) return;
      const user_id = await currentUserId();
      const { error } = await supabase.from("goal_milestones").insert({
        goal_id: goal.id, user_id, title: newMilestone.trim(),
        sort_order: milestones.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMilestone(""); setAdding(false);
      qc.invalidateQueries();
    },
  });

  const removeMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goal_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });

  const isComplete = derivedPct >= 100;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}>
      <Card className="p-6 card-surface relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 w-full" style={{ background: goal.color }} />

        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {goal.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {goal.category}
                </span>
              )}
              {isComplete && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sage/30 text-foreground/80 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Conquistada
                </span>
              )}
            </div>
            <h3 className="font-display text-xl font-semibold mt-1 truncate">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
            )}
          </div>
          <GoalDialog
            goal={goal}
            trigger={
              <Button variant="ghost" size="icon" className="shrink-0">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{derivedPct}%</span>
          </div>
          <Progress value={derivedPct} className="h-2" />
        </div>

        {goal.target_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <CalendarClock className="h-3.5 w-3.5" />
            {format(new Date(goal.target_date + "T00:00:00"), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        )}

        <div className="space-y-1.5 pt-3 border-t border-border/60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Marcos ({doneCount}/{milestones.length})
          </p>
          {milestones.map((m) => (
            <div key={m.id} className="group flex items-center gap-2 py-1">
              <Checkbox checked={m.done}
                onCheckedChange={() => toggleMilestone.mutate(m)} />
              <span className={`text-sm flex-1 ${m.done ? "line-through text-muted-foreground" : ""}`}>
                {m.title}
              </span>
              <button
                onClick={() => removeMilestone.mutate(m.id)}
                className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                remover
              </button>
            </div>
          ))}

          {adding ? (
            <div className="flex gap-2 pt-1">
              <Input autoFocus value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addMilestone.mutate();
                  if (e.key === "Escape") { setAdding(false); setNewMilestone(""); }
                }}
                placeholder="Novo marco..." className="h-8 text-sm" />
              <Button size="sm" onClick={() => addMilestone.mutate()} disabled={!newMilestone.trim()}>
                Adicionar
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar marco
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function useGoalMilestones(goalIds: string[]) {
  return useQuery({
    queryKey: ["goal-milestones", goalIds.sort().join(",")],
    queryFn: async () => {
      if (goalIds.length === 0) return [] as GoalMilestone[];
      const { data, error } = await supabase
        .from("goal_milestones").select("*")
        .in("goal_id", goalIds).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: goalIds.length > 0,
  });
}
