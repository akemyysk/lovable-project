import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./carta";

export const Route = createFileRoute("/_authenticated/momentos")({
  component: () => <ComingSoon
    title="Momentos Importantes"
    description="Um diário mês a mês das pequenas e grandes conquistas, com timeline anual."
  />,
});
