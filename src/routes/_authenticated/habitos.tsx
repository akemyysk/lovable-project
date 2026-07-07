import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/habitos")({
  beforeLoad: () => { throw redirect({ to: "/planejamento" }); },
});
