import { createServerFn } from "@tanstack/react-start";
import type { ScanPayload } from "./types";

export const runScan = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data && typeof data === "object" ? (data as { force?: unknown }) : {};
    return { force: Boolean(body.force) };
  })
  .handler(async ({ data }): Promise<ScanPayload> => {
    const { executeScan } = await import("./run.server");
    return executeScan(data.force);
  });
