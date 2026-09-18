import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Opportunity } from "@/lib/scanner/types";
import { useT } from "@/lib/i18n/store";

export function SpreadChart({ items }: { items: Opportunity[] }) {
  const { t } = useT();
  const data = items.slice(0, 8).map((opp) => ({
    symbol: opp.symbol,
    spread: Number(opp.spread.toFixed(1)),
  }));
  if (data.length < 2) return null;

  return (
    <div className="rounded-xl bg-surface p-3 shadow-border sm:p-4">
      <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
        {t("topSpreads")}
      </p>
      <div className="h-40 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="symbol"
              width={56}
              tick={{ fill: "var(--color-fg)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{
                fill: "color-mix(in oklab, var(--color-fg) 6%, transparent)",
              }}
              contentStyle={{
                background: "var(--color-surface-2)",
                border:
                  "1px solid color-mix(in oklab, var(--color-fg) 12%, transparent)",
                borderRadius: 8,
                color: "var(--color-fg)",
                fontSize: 12,
              }}
              formatter={(value: number | string) => [
                `${value} % APR`,
                t("spread"),
              ]}
            />
            <Bar
              dataKey="spread"
              fill="var(--color-gain)"
              radius={[0, 4, 4, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
