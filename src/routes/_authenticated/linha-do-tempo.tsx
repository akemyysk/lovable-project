import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { supabase } from "@/integrations/supabase/client";
import {
  currentUserId, fetchMonthSummaries, fetchYearSummaries,
  fetchHabits, fetchHabitLogsBetween, fetchAllGoals,
  type MonthSummary, type YearSummary,
} from "@/lib/queries";
import { monthRange, toDateKey, toMonthKey } from "@/lib/date-utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Clock, Sparkles, ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/linha-do-tempo")({
  component: TimelinePage,
});

const sb = supabase as unknown as {
  from: (t: string) => {
    upsert: (v: unknown, o?: unknown) => Promise<{ error: unknown }>;
    update: (v: unknown) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
};

const MONTH_LABELS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];


function TimelinePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"months" | "years">("months");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [monthIdx, setMonthIdx] = useState<number>(new Date().getMonth());


  const { data: months = [] } = useQuery({ queryKey: ["month-summaries"], queryFn: fetchMonthSummaries });
  const { data: years = [] } = useQuery({ queryKey: ["year-summaries"], queryFn: fetchYearSummaries });

  const monthsOfYear = months.filter((m) => m.month_key.startsWith(String(year)));
  const yearSummary = years.find((y) => y.year_key === String(year));

  // Todas as fotos do ano (carrossel)
  const yearPhotos = monthsOfYear.flatMap((m) => m.photos ?? []);

  const generateLastMonth = useMutation({
    mutationFn: async () => {
      const target = subMonths(new Date(), 1);
      const monthKey = toMonthKey(target);
      const { start, end } = monthRange(target);
      const startK = toDateKey(start);
      const endK = toDateKey(end);

      const [habits, logs, goals] = await Promise.all([
        fetchHabits(),
        fetchHabitLogsBetween(startK, endK),
        fetchAllGoals(),
      ]);
      let scheduled = 0, done = 0;
      const daysInMonth = end.getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(target.getFullYear(), target.getMonth(), day);
        const k = toDateKey(d);
        const dow = d.getDay();
        habits.forEach((h) => {
          if (!(h.weekdays as unknown as number[]).includes(dow)) return;
          const log = logs.find((l) => l.habit_id === h.id && l.log_date === k);
          if (log?.status === "done") { scheduled++; done++; }
          else { scheduled++; }
        });
      }
      const pct = scheduled ? Math.round((done / scheduled) * 100) : 0;
      const goalsDone = goals.filter((g) => {
        if (!g.completed_at) return false;
        return g.completed_at.slice(0, 7) === monthKey;
      }).length;

      const user_id = await currentUserId();
      const { error } = await sb.from("month_summaries").upsert({
        user_id, month_key: monthKey,
        habits_done: done, habits_total: scheduled, completion_pct: pct,
        moments_count: 0, goals_done: goalsDone,
      }, { onConflict: "user_id,month_key" });
      if (error) throw error as Error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["month-summaries"] }); toast.success("Resumo gerado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const generateYearSummary = useMutation({
    mutationFn: async () => {
      const habitsDone = monthsOfYear.reduce((s, m) => s + m.habits_done, 0);
      const habitsTotal = monthsOfYear.reduce((s, m) => s + m.habits_total, 0);
      const avgPct = monthsOfYear.length
        ? Math.round(monthsOfYear.reduce((s, m) => s + m.completion_pct, 0) / monthsOfYear.length)
        : 0;
      const momentsCount = monthsOfYear.reduce((s, m) => s + m.moments_count, 0);
      const goalsDone = monthsOfYear.reduce((s, m) => s + m.goals_done, 0);
      const user_id = await currentUserId();
      const { error } = await sb.from("year_summaries").upsert({
        user_id, year_key: String(year),
        habits_done: habitsDone, habits_total: habitsTotal, avg_pct: avgPct,
        moments_count: momentsCount, goals_done: goalsDone,
      }, { onConflict: "user_id,year_key" });
      if (error) throw error as Error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["year-summaries"] }); toast.success("Retrospectiva atualizada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Sua evolução ao longo do tempo</p>
          <h1 className="font-display text-4xl font-semibold flex items-center gap-2 text-primary">
            <Clock className="h-8 w-8" /> Linha do Tempo
          </h1>
        </div>
        <Button onClick={() => generateLastMonth.mutate()} disabled={generateLastMonth.isPending}>
          <Sparkles className="h-4 w-4 mr-1" /> Gerar resumo do mês anterior
        </Button>
      </header>

      {/* Navegação de ano */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-display text-2xl font-semibold text-primary min-w-[80px] text-center">{year}</h2>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}
          disabled={year >= currentYear}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "months" | "years")}>
        <TabsList>
          <TabsTrigger value="months">Meses</TabsTrigger>
          <TabsTrigger value="years">Ano</TabsTrigger>
        </TabsList>

        <TabsContent value="months" className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setMonthIdx((i) => (i + 11) % 12)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-display text-xl font-semibold text-primary min-w-[140px] text-center">
              {MONTH_LABELS[monthIdx]}
            </h3>
            <Button variant="outline" size="icon" onClick={() => setMonthIdx((i) => (i + 1) % 12)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {(() => {
            const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
            const found = monthsOfYear.find((m) => m.month_key === monthKey);
            return found
              ? <MonthCard key={found.id} summary={found} />
              : <EmptyState label={`Nenhum resumo em ${MONTH_LABELS[monthIdx]} de ${year} ainda.`} />;
          })()}
        </TabsContent>


        <TabsContent value="years" className="mt-6 space-y-4">
          {monthsOfYear.length === 0 ? (
            <EmptyState label={`Sem dados suficientes para ${year}.`} />
          ) : (
            <YearView year={year} months={monthsOfYear} photos={yearPhotos}
              summary={yearSummary} onRegenerate={() => generateYearSummary.mutate()}
              regenerating={generateYearSummary.isPending} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card className="card-surface p-8 text-center">
      <p className="text-sm text-muted-foreground italic">{label}</p>
    </Card>
  );
}

function MonthCard({ summary }: { summary: MonthSummary }) {
  const qc = useQueryClient();
  const [reflection, setReflection] = useState(summary.reflection ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await sb.from("month_summaries")
        .update({ reflection }).eq("id", summary.id);
      if (error) throw error as Error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["month-summaries"] }); toast.success("Reflexão salva"); },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const user_id = await currentUserId();
      const path = `${user_id}/timeline/${summary.month_key}-${crypto.randomUUID()}`;
      const up = await supabase.storage.from("user-photos").upload(path, file);
      if (up.error) throw up.error;
      const { data: signed } = await supabase.storage
        .from("user-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? path;
      const newPhotos = [...(summary.photos ?? []), url];
      const { error } = await sb.from("month_summaries")
        .update({ photos: newPhotos }).eq("id", summary.id);
      if (error) throw error as Error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["month-summaries"] }); toast.success("Foto adicionada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePhoto = useMutation({
    mutationFn: async (photoUrl: string) => {
      const newPhotos = (summary.photos ?? []).filter((p) => p !== photoUrl);
      const { error } = await sb.from("month_summaries")
        .update({ photos: newPhotos }).eq("id", summary.id);
      if (error) throw error as Error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["month-summaries"] }); toast.success("Foto removida"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [y, m] = summary.month_key.split("-");
  const label = format(new Date(Number(y), Number(m) - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Card className="card-surface p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-2xl font-semibold capitalize text-primary">{label}</h3>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4 mr-1" /> Foto
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Conclusão" value={`${summary.habits_done}/${summary.habits_total}`} />
          <Stat label="Porcentagem" value={`${summary.completion_pct}%`} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Momentos" value={String(summary.moments_count)} />
          <Stat label="Metas" value={String(summary.goals_done)} />
        </div>
      </div>
      {(summary.photos ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(summary.photos ?? []).map((p, i) => (
            <div key={i} className="relative group">
              <img src={p} alt={`Foto ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border" />
              <button
                type="button"
                onClick={() => { if (confirm("Remover esta foto?")) removePhoto.mutate(p); }}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow"
                aria-label="Remover foto"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">Reflexão do mês</label>
        <Textarea rows={3} value={reflection} onChange={(e) => setReflection(e.target.value)}
          placeholder="O que marcou este mês?" />
        <Button size="sm" variant="outline" onClick={() => save.mutate()}>Salvar reflexão</Button>
      </div>
    </Card>
  );
}

function YearView({
  year, months, photos, summary, onRegenerate, regenerating,
}: {
  year: number; months: MonthSummary[]; photos: string[];
  summary?: YearSummary; onRegenerate: () => void; regenerating: boolean;
}) {
  const qc = useQueryClient();
  const [retrospective, setRetrospective] = useState(summary?.retrospective ?? "");
  const [idx, setIdx] = useState(0);

  useEffect(() => setRetrospective(summary?.retrospective ?? ""), [summary?.id]);

  useEffect(() => { setIdx(0); }, [year]);

  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), 3500);
    return () => clearInterval(t);
  }, [photos.length]);

  const safeIdx = photos.length > 0 ? idx % photos.length : 0;

  const habitsDone = months.reduce((s, m) => s + m.habits_done, 0);
  const habitsTotal = months.reduce((s, m) => s + m.habits_total, 0);
  const avgPct = months.length
    ? Math.round(months.reduce((s, m) => s + m.completion_pct, 0) / months.length)
    : 0;
  const momentsCount = months.reduce((s, m) => s + m.moments_count, 0);
  const goalsDone = months.reduce((s, m) => s + m.goals_done, 0);

  const saveRetro = useMutation({
    mutationFn: async () => {
      if (!summary) return;
      const { error } = await sb.from("year_summaries")
        .update({ retrospective }).eq("id", summary.id);
      if (error) throw error as Error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["year-summaries"] }); toast.success("Retrospectiva salva"); },
  });

  return (
    <Card className="card-surface p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-3xl font-semibold text-primary">Retrospectiva {year}</h3>
        <Button variant="outline" size="sm" onClick={onRegenerate} disabled={regenerating}>
          <Sparkles className="h-4 w-4 mr-1" /> Atualizar
        </Button>
      </div>

      {photos.length > 0 && (
        <div className="relative w-full h-64 rounded-xl overflow-hidden bg-muted">
          {photos.map((p, i) => (
            <img key={i} src={p} alt={`Momento ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === safeIdx ? "opacity-100" : "opacity-0"}`} />
          ))}
          {photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`h-1.5 w-1.5 rounded-full ${i === safeIdx ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="Hábitos" value={`${habitsDone}/${habitsTotal}`} />
        <Stat label="Média" value={`${avgPct}%`} />
        <Stat label="Momentos" value={String(momentsCount)} />
        <Stat label="Metas" value={String(goalsDone)} />
      </div>

      {summary && (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Retrospectiva</label>
          <Textarea rows={4} value={retrospective} onChange={(e) => setRetrospective(e.target.value)}
            placeholder="O que este ano representou para você?" />
          <Button size="sm" variant="outline" onClick={() => saveRetro.mutate()}>Salvar retrospectiva</Button>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/40">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold mt-1 text-primary">{value}</p>
    </div>
  );
}
