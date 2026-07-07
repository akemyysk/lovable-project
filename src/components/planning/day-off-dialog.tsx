import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, fetchDayOffsBetween } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toDateKey } from "@/lib/date-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const sb = supabase as unknown as {
  from: (t: string) => {
    insert: (v: any) => any;
    delete: () => { eq: (c: string, v: any) => Promise<{ error: any }> };
  };
};

export function DayOffDialog({ trigger, rangeStart, rangeEnd }: {
  trigger: React.ReactNode;
  rangeStart: string;
  rangeEnd: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [note, setNote] = useState("");

  const { data: offs = [] } = useQuery({
    queryKey: ["day-offs", rangeStart, rangeEnd],
    queryFn: () => fetchDayOffsBetween(rangeStart, rangeEnd),
    enabled: open,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!date) return;
      const user_id = await currentUserId();
      const { error } = await sb.from("day_offs").insert({
        user_id, day_date: toDateKey(date), note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["day-offs"] }); setNote(""); toast.success("Folga cadastrada"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("day_offs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["day-offs"] }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Folgas</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR}
            className="p-3 pointer-events-auto rounded-md border" />
          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: Folga programada" />
          </div>
          <Button onClick={() => add.mutate()} disabled={!date || add.isPending} className="w-full">
            Adicionar folga
          </Button>

          {offs.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {offs.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-1 px-2 text-sm rounded hover:bg-muted/50">
                  <span>
                    {format(new Date(o.day_date + "T00:00:00"), "d 'de' MMM", { locale: ptBR })}
                    {o.note ? ` · ${o.note}` : ""}
                  </span>
                  <button onClick={() => del.mutate(o.id)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
