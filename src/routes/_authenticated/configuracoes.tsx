import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");

  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const user_id = await currentUserId();
      const { data } = await supabase.from("profiles").select("*").eq("id", user_id).maybeSingle();
      if (data) setDisplayName(data.display_name ?? "");
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const user_id = await currentUserId();
      const { data: existing } = await supabase.from("profiles").select("id").eq("id", user_id).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert({ id: user_id, display_name: displayName });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Perfil atualizado"); },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-semibold">Configurações</h1>

      <Card className="card-surface p-6 space-y-4">
        <h2 className="font-medium">Perfil</h2>
        <div className="space-y-2">
          <Label>Nome de exibição</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
      </Card>

      <Card className="card-surface p-6">
        <h2 className="font-medium mb-2">Preferências</h2>
        <p className="text-sm text-muted-foreground">
          Aparência, notificações, backup e mais opções chegam nas próximas iterações.
        </p>
      </Card>
    </div>
  );
}
