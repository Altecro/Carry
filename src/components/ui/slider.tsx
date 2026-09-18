import * as React from "react";
import { cn } from "@/lib/utils";

type SliderProps = {
  min: number;
  max: number;
  step: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
};

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min, max, step, value, onValueChange }, ref) => {
    const current = value[0] ?? min;
    const pct = max === min ? 0 : ((current - min) / (max - min)) * 100;
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        suppressHydrationWarning
        onChange={(event) => onValueChange([Number(event.target.value)])}
        style={{ ["--slider-pct" as string]: `${pct}%` }}
        className={cn("slider-range", className)}
      />
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
