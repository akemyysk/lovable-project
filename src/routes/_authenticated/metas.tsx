import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllGoals, currentUserId, type Goal } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, CalendarIcon, Check, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/metas")({
  component: MetasPage,
  head: () => ({ meta: [{ title: "Grandes Metas · Serenity" }] }),
});

type Category = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
};

const CATEGORIES: Category[] = [
  { key: "growth",       label: "Crescimento",   emoji: "🌱", color: "hsl(150 55% 38%)", bg: "hsl(150 55% 93%)" },
  { key: "experiences",  label: "Experiências",  emoji: "🌍", color: "hsl(30 85% 45%)",  bg: "hsl(30 85% 94%)" },
  { key: "inner",        label: "Vida Interna",  emoji: "🧠", color: "hsl(270 55% 50%)", bg: "hsl(270 60% 94%)" },
  { key: "self_care",    label: "Autocuidado",   emoji: "💙", color: "hsl(210 75% 48%)", bg: "hsl(210 75% 94%)" },
];

const catByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<string, Category>;

function celebrate() {
  confetti({
    particleCount: 140, spread: 90, origin: { y: 0.6 },
    colors: CATEGORIES.map((c) => c.color),
  });
}

function MetasPage() {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newCategory, setNewCategory] = useState<string>("growth");

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"], queryFn: fetchAllGoals,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) return;
      const user_id = await currentUserId();
      const { error } = await supabase.from("goals").insert({
        user_id, title: newTitle.trim(),
        target_date: newDate ? format(newDate, "yyyy-MM-dd") : null,
        horizon: "year", color: catByKey[newCategory]?.color ?? "#2E6DF6",
        category: newCategory,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNewTitle(""); setNewDate(undefined); qc.invalidateQueries({ queryKey: ["goals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (g: Goal) => {
      const complete = !(g.status === "completed" || g.progress >= 100);
      const { error } = await supabase.from("goals").update({
        status: complete ? "completed" : "active",
        progress: complete ? 100 : 0,
        completed_at: complete ? new Date().toISOString() : null,
      }).eq("id", g.id);
      if (error) throw error;
      return complete;
    },
    onSuccess: (completed) => {
      qc.invalidateQueries();
      if (completed) celebrate();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const done = goals.filter((g) => g.status === "completed" || g.progress >= 100).length;

  // Agrupar por categoria, mantendo ordem definida
  const grouped = CATEGORIES.map((c) => ({
    cat: c,
    items: goals.filter((g) => (g.category ?? "growth") === c.key),
  })).filter((g) => g.items.length > 0);
  const uncategorized = goals.filter((g) => !g.category || !catByKey[g.category]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-2 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-lilac/10 blur-2xl" />
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sonhos em movimento</p>
        <h1 className="font-display text-5xl font-semibold">
          Grandes Metas do Ano
        </h1>

        {goals.length > 0 && (
          <p className="font-display text-lg text-primary">
            {done} de {goals.length} conquistadas
          </p>
        )}
      </header>

      {/* Legenda */}
      <Card className="card-surface p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Categorias</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: c.bg, color: c.color }}>
              <span>{c.emoji}</span>
              <span className="font-medium">{c.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Criar */}
      <Card className="card-surface p-4">
        <div className="flex gap-2 items-center flex-wrap">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nova grande meta…"
            onKeyDown={(e) => e.key === "Enter" && create.mutate()}
            className="flex-1 min-w-[200px]" />
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {newDate ? format(newDate, "dd/MM/yyyy") : "Data (opcional)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={newDate} onSelect={setNewDate} locale={ptBR}
                className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Button onClick={() => create.mutate()} disabled={!newTitle.trim() || create.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Carregando…</p>
      ) : goals.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="font-display text-2xl text-foreground/80">
            ✨ O que você quer conquistar este ano?
          </p>
          <p className="text-muted-foreground italic">Comece adicionando sua primeira grande meta.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ cat, items }) => (
            <section key={cat.key} className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-lg">{cat.emoji}</span>
                <h2 className="font-display text-2xl font-semibold" style={{ color: cat.color }}>
                  {cat.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {items.filter((g) => g.status === "completed" || g.progress >= 100).length}/{items.length}
                </span>
              </div>
              <Card className="card-surface p-2 overflow-hidden">
                <div className="h-1 -mx-2 -mt-2 mb-2" style={{ background: cat.color }} />
                <motion.ul layout className="divide-y">
                  <AnimatePresence>
                    {items.map((g) => (
                      <GoalRow key={g.id} goal={g} category={cat}
                        onToggle={() => toggle.mutate(g)}
                        onRemove={() => remove.mutate(g.id)} />
                    ))}
                  </AnimatePresence>
                </motion.ul>
              </Card>
            </section>
          ))}
          {uncategorized.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-xl text-muted-foreground">Sem categoria</h2>
              <Card className="card-surface p-2">
                <ul className="divide-y">
                  {uncategorized.map((g) => (
                    <GoalRow key={g.id} goal={g} category={CATEGORIES[0]}
                      onToggle={() => toggle.mutate(g)}
                      onRemove={() => remove.mutate(g.id)} />
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function GoalRow({
  goal, category, onToggle, onRemove,
}: {
  goal: Goal & { completion_photo?: string | null };
  category: Category;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const isDone = goal.status === "completed" || goal.progress >= 100;

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const user_id = await currentUserId();
      const path = `${user_id}/goals/${goal.id}-${crypto.randomUUID()}`;
      const up = await supabase.storage.from("user-photos").upload(path, file);
      if (up.error) throw up.error;
      const { data: signed } = await supabase.storage
        .from("user-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? path;
      const { error } = await supabase.from("goals")
        .update({ completion_photo: url }).eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); toast.success("Foto anexada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const photo = (goal as { completion_photo?: string | null }).completion_photo ?? null;

  return (
    <motion.li layout
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex items-center gap-3 py-3 px-2 group">
      <button
        onClick={onToggle}
        aria-label="Marcar conclusão"
        className={`h-6 w-6 shrink-0 rounded-md grid place-items-center border-2 transition-all`}
        style={{
          borderColor: category.color,
          background: isDone ? category.color : "transparent",
        }}>
        {isDone && <Check className="h-4 w-4 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{goal.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {goal.target_date && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(new Date(goal.target_date + "T00:00:00"), "d MMM yyyy", { locale: ptBR })}
            </span>
          )}
          {isDone && goal.completed_at && (
            <span className="flex items-center gap-1" style={{ color: category.color }}>
              <Check className="h-3 w-3" /> Concluída em {format(new Date(goal.completed_at), "d MMM yyyy", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
      {photo && (
        <img src={photo} alt="Conquista" className="h-10 w-10 rounded-lg object-cover border" />
      )}
      {isDone && (
        <>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }} />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileRef.current?.click()}
            aria-label="Anexar foto">
            <ImagePlus className="h-4 w-4" />
          </Button>
        </>
      )}
      <button onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-destructive p-1">
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.li>
  );
}
