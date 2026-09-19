import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/snapshot")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { takeSnapshot } = await import("@/lib/scanner/snapshot.server");
          const body = await takeSnapshot();
          return Response.json(body);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "snapshot failed";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
