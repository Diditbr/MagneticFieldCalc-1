import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalculationPointInputsProps {
  x: number;
  y: number;
  z: number;
  onChange: (axis: "x" | "y" | "z", value: number) => void;
  unit: string;
}

export function CalculationPointInputs({
  x,
  y,
  z,
  onChange,
  unit,
}: CalculationPointInputsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold">Calculation Point</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">
              Position where the magnetic field will be calculated, relative to the magnet center
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["x", "y", "z"] as const).map((axis) => (
          <div key={axis} className="space-y-2">
            <Label htmlFor={`calc-${axis}`} className="text-sm font-medium uppercase">
              {axis}
            </Label>
            <div className="relative">
              <Input
                id={`calc-${axis}`}
                type="number"
                step="0.1"
                value={axis === "x" ? x : axis === "y" ? y : z}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    onChange(axis, value);
                  }
                }}
                className="font-mono pr-12"
                data-testid={`input-calc-${axis}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        Origin (0,0,0) is at the magnet's geometric center
      </div>
    </div>
  );
}
