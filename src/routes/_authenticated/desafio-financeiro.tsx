import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./carta";

export const Route = createFileRoute("/_authenticated/desafio-financeiro")({
  component: () => <ComingSoon
    title="Desafio Financeiro"
    description="Junte R$10.000 marcando quadradinhos. Progresso, valor economizado e reinício automático."
  />,
});
