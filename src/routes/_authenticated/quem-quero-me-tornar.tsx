import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./carta";

export const Route = createFileRoute("/_authenticated/quem-quero-me-tornar")({
  component: () => <ComingSoon
    title="Quem Quero Me Tornar"
    description="Áreas da sua vida (carreira, saúde, relacionamentos...) e a versão de você que está sendo construída."
  />,
});
