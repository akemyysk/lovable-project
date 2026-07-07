import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, type PeriodGoal } from "@/lib/queries";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GoalsList({ scope, periodKey, goals }: { scope: "week" | "month"; periodKey: string; goals: PeriodGoal[] }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("period_goals").insert({
        user_id, scope, period_key: periodKey, title,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["period_goals"] }); setTitle(""); },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("period_goals").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["period_goals"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("period_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["period_goals"] }),
  });

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {goals.map((g) => (
          <motion.div key={g.id} layout
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 group">
            <Checkbox checked={g.done} onCheckedChange={(v) => toggle.mutate({ id: g.id, done: !!v })} />
            <span className={`text-sm flex-1 ${g.done ? "line-through text-muted-foreground" : ""}`}>{g.title}</span>
            <button onClick={() => del.mutate(g.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) add.mutate(); }} className="flex gap-2 pt-2">
        <Input placeholder="Nova meta..." value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit" size="icon" disabled={!title.trim()}><Plus className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
