import { createFileRoute } from "@tanstack/react-router";
import { ResearchPage } from "@/components/scanner/research-page";

export const Route = createFileRoute("/research")({
  component: Research,
  head: () => ({
    meta: [{ title: "Carry · Recherche" }],
  }),
});

function Research() {
  return <ResearchPage />;
}
