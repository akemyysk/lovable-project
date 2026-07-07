import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="card-surface p-10 text-center bg-gradient-to-br from-background via-sky/20 to-lilac/20">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{description}</p>
        <p className="text-xs text-muted-foreground mt-6">Em breve nesta jornada — próximas iterações.</p>
      </Card>
    </div>
  );
}

export { ComingSoon };

export const Route = createFileRoute("/_authenticated/carta")({
  component: () => <ComingSoon
    title="Carta para Mim"
    description="Um espaço para escrever sua carta, salvar automaticamente e revisitar sempre que precisar de motivação."
  />,
});
