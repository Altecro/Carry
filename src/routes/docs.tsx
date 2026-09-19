import { createFileRoute } from "@tanstack/react-router";
import { DocsPage } from "@/components/scanner/docs-page";

export const Route = createFileRoute("/docs")({
  component: Docs,
  head: () => ({
    meta: [{ title: "Carry · Guide" }],
  }),
});

function Docs() {
  return <DocsPage />;
}
