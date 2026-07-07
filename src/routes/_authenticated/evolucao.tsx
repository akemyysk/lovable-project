import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./carta";

export const Route = createFileRoute("/_authenticated/evolucao")({
  component: () => <ComingSoon
    title="Evolução Anual"
    description="Um gráfico automático de Janeiro a Dezembro, calculado com base nos seus hábitos e tarefas."
  />,
});
