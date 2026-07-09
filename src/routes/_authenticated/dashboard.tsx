import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { supabase } from "@/integrations/supabase/client";
import { greetingFor, toDateKey, monthRange } from "@/lib/date-utils";
import {
  fetchAllPendingTasks, fetchEventsBetween, fetchGoalsByHorizon, currentUserId,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, Image as ImageIcon, Trophy, Calendar as CalendarIcon, ListChecks, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const today = now;
  const month = monthRange(today);
  const monthStart = toDateKey(month.start);
  const monthEnd = toDateKey(month.end);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const user_id = await currentUserId();
      const { data } = await supabase.from("profiles").select("*").eq("id", user_id).maybeSingle();
      return data as { display_name: string | null; vision_images: string[] | null } | null;
    },
  });

  const { data: pendingTasks = [] } = useQuery({
    queryKey: ["tasks-pending"], queryFn: fetchAllPendingTasks,
  });
  const { data: monthEvents = [] } = useQuery({
    queryKey: ["events", monthStart, monthEnd],
    queryFn: () => fetchEventsBetween(monthStart, monthEnd),
  });
  const { data: yearGoals = [] } = useQuery({
    queryKey: ["goals", "year"], queryFn: () => fetchGoalsByHorizon("year"),
  });

  const goalsDone = yearGoals.filter((g) => g.status === "completed" || g.progress >= 100).length;
  const goalsTotal = yearGoals.length;
  const goalsPct = goalsTotal ? Math.round((goalsDone / goalsTotal) * 100) : 0;
  const dayProgress = goalsPct;

  const displayName = profile?.display_name ?? "Akemy";
  const visionImages = profile?.vision_images ?? [];

  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const user_id = await currentUserId();
      const path = `${user_id}/vision/${crypto.randomUUID()}-${file.name}`;
      const up = await supabase.storage.from("user-photos").upload(path, file);
      if (up.error) throw up.error;
      const { data: signed } = await supabase.storage
        .from("user-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? path;
      const next = [...visionImages, url];
      const { error } = await supabase.from("profiles")
        .update({ vision_images: next }).eq("id", user_id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Imagem adicionada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeImage = useMutation({
    mutationFn: async (url: string) => {
      const user_id = await currentUserId();
      const next = visionImages.filter((u) => u !== url);
      const { error } = await supabase.from("profiles")
        .update({ vision_images: next }).eq("id", user_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground capitalize">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <h1 className="font-display text-4xl font-semibold">
            {greetingFor(today)}, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl italic">
            Aqui está um resumo da sua jornada. Um passo de cada vez.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="clock-classic text-5xl text-primary tabular-nums leading-none">
            {format(today, "HH:mm")}
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Agora</p>
        </div>
      </header>

      {/* 1. Progresso do dia */}
      <Card className="p-6 card-surface bg-gradient-to-br from-primary/15 via-background to-lilac/15 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Progresso do dia
          </h2>
          <span className="font-display text-2xl font-semibold text-primary">{dayProgress}%</span>
        </div>
        <Progress value={dayProgress} className="h-2" />
      </Card>

      {/* 2. Tarefas pendentes (todos os escopos: dia + semana + mês) */}
      <Card className="p-6 card-surface">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" /> Tarefas pendentes
          </h2>
          <Link to="/planejamento" className="text-sm text-primary hover:underline">Ver planejamento</Link>
        </div>
        {pendingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center italic">
            ✨ Nada pendente. Que semana leve!
          </p>
        ) : (
          <ul className="divide-y">
            {pendingTasks.slice(0, 10).map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <span className="text-sm flex-1 text-task font-medium">{t.title}</span>
                <span className="text-[10px] uppercase text-muted-foreground">{t.scope}</span>
                {t.due_date && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(t.due_date + "T00:00:00"), "dd/MM")}
                  </span>
                )}
                {t.due_time && (
                  <span className="text-xs text-muted-foreground">🕒 {t.due_time.slice(0,5)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 3. Eventos do mês */}
      <Card className="p-6 card-surface">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" /> Eventos do mês
          </h2>
          <span className="text-sm text-muted-foreground">{monthEvents.length}</span>
        </div>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center italic">🌸 Nenhum compromisso este mês.</p>
        ) : (
          <ul className="divide-y">
            {monthEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">
                  {format(new Date(e.event_date + "T00:00:00"), "dd/MM")}
                </span>
                <span className="text-sm font-medium text-event flex-1">{e.title}</span>
                {e.start_time && (
                  <span className="text-xs text-muted-foreground">🕒 {e.start_time.slice(0,5)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 4. Grandes Metas concluídas — apenas contagem */}
      <Card className="p-6 card-surface">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Grandes Metas concluídas
          </h2>
          <Link to="/metas" className="text-sm text-primary hover:underline">Ver todas</Link>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-display text-3xl font-semibold text-primary">{goalsDone}/{goalsTotal}</p>
          <Progress value={goalsPct} className="h-1.5 flex-1" />
        </div>
      </Card>

      {/* 5. Vision Board */}
      <Card className="p-6 card-surface">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" /> Vision Board
          </h2>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Adicionar imagem
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage.mutate(f);
              e.target.value = "";
            }} />
        </div>
        {visionImages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center italic">
            🌟 Adicione imagens que representam seus sonhos.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {visionImages.map((url) => (
              <div key={url} className="group relative aspect-square rounded-xl overflow-hidden border">
                <img src={url} alt="Vision" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage.mutate(url)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 grid place-items-center transition-opacity"
                  aria-label="Remover">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 6. Frase da Carta para Mim */}
      <Card className="p-6 card-surface bg-gradient-to-br from-primary/10 via-background to-lilac/15 border-primary/20">
        <p className="font-display text-lg italic text-foreground/85">
          "Lembre-se por que começou. Cada pequeno passo é uma versão nova de você."
        </p>
        <p className="text-xs text-muted-foreground mt-2">— Sua Carta para Mim</p>
      </Card>
    </div>
  );
}
