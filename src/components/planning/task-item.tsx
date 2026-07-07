import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/lib/queries";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { MoreHorizontal, Trash2, Pencil, XCircle, CalendarClock } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDialog } from "./task-dialog";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { toDateKey } from "@/lib/date-utils";
import { ptBR } from "date-fns/locale/pt-BR";

type Status = "pending" | "done" | "missed";

export function TaskItem({ task, kind = "task" }: { task: Task; kind?: "task" | "event" }) {
  const qc = useQueryClient();
  const [rescheduling, setRescheduling] = useState(false);

  const status = task.status as Status;

  const setStatus = useMutation({
    mutationFn: async (s: Status) => {
      const { error } = await supabase.from("tasks").update({
        status: s, completed_at: s === "done" ? new Date().toISOString() : null,
      }).eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });

  const reschedule = useMutation({
    mutationFn: async (newDate: Date) => {
      const { error } = await supabase.from("tasks").update({
        due_date: toDateKey(newDate), status: "pending", completed_at: null,
      }).eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries(); setRescheduling(false); toast.success("Tarefa remarcada"); },
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Removida"); },
  });

  // color by kind
  const baseColor = kind === "event" ? "text-event" : "text-task";

  const textCls =
    status === "done" ? "line-through text-muted-foreground" :
    status === "missed" ? "line-through text-muted-foreground/70" :
    baseColor;

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 group transition-colors">
      <button
        type="button"
        onClick={() =>
          setStatus.mutate(status === "done" ? "pending" : status === "missed" ? "pending" : "done")
        }
        className="shrink-0"
        aria-label="Alternar conclusão"
      >
        {status === "done" ? (
          <span className="h-4 w-4 rounded-sm bg-primary text-primary-foreground grid place-items-center text-[10px] font-bold">✓</span>
        ) : status === "missed" ? (
          <span className="h-4 w-4 rounded-sm bg-destructive text-destructive-foreground grid place-items-center text-[10px] font-bold">✕</span>
        ) : (
          <Checkbox checked={false} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${textCls}`}>{task.title}</p>
        {task.due_time && (
          <p className="text-xs text-muted-foreground">🕒 {task.due_time.slice(0, 5)}</p>
        )}
      </div>

      {status === "missed" && (
        <Popover open={rescheduling} onOpenChange={setRescheduling}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <CalendarClock className="h-3.5 w-3.5 mr-1" /> Remarcar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" locale={ptBR} initialFocus
              onSelect={(d) => d && reschedule.mutate(d)} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <TaskDialog task={task} trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
          } />
          <DropdownMenuItem onClick={() => setStatus.mutate("missed")}>
            <XCircle className="h-4 w-4 mr-2" /> Marcar não concluída
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRescheduling(true)}>
            <CalendarClock className="h-4 w-4 mr-2" /> Remarcar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => del.mutate()} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
