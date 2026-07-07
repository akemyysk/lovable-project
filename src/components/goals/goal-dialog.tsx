import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, type Goal, type GoalHorizon, HORIZON_LABELS } from "@/lib/queries";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const COLORS = ["#2F5D8C", "#8FA98F", "#D8CCF2", "#E6B89C", "#B8D0E6", "#C7B8EA"];

interface Props {
  trigger: React.ReactNode;
  goal?: Goal | null;
  defaultHorizon?: GoalHorizon;
}

export function GoalDialog({ trigger, goal, defaultHorizon = "year" }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [horizon, setHorizon] = useState<string>(goal?.horizon ?? defaultHorizon);
  const [category, setCategory] = useState(goal?.category ?? "");
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const [color, setColor] = useState(goal?.color ?? COLORS[0]);
  const [progress, setProgress] = useState<number>(goal?.progress ?? 0);

  const save = useMutation({
    mutationFn: async () => {
      const user_id = await currentUserId();
      const payload = {
        user_id, title, description: description || null,
        horizon, category: category || null,
        target_date: targetDate || null, color,
        progress: Math.max(0, Math.min(100, progress)),
        status: progress >= 100 ? "completed" : "active",
        completed_at: progress >= 100 ? new Date().toISOString() : null,
      };
      if (goal) {
        const { error } = await supabase.from("goals").update(payload).eq("id", goal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success(goal ? "Meta atualizada" : "Meta criada");
      setOpen(false);
      if (!goal) { setTitle(""); setDescription(""); setCategory(""); setTargetDate(""); setProgress(0); }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!goal) return;
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Meta excluída");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova grande meta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Publicar meu primeiro livro" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Por que essa meta importa para você?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Horizonte</Label>
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(HORIZON_LABELS) as GoalHorizon[]).map((h) => (
                    <SelectItem key={h} value={h}>{HORIZON_LABELS[h]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data-alvo</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Carreira, saúde, família..." />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Progresso: {progress}%</Label>
            <input type="range" min={0} max={100} step={5} value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {goal && (
              <Button variant="ghost" className="text-destructive"
                onClick={() => remove.mutate()} disabled={remove.isPending}>
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={!title || save.isPending}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
