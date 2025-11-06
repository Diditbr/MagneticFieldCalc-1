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
        <Label className="text-sm font-semibold">Berechnungspunkt</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">
              Position, an der das Magnetfeld berechnet wird. Z=0 ist an der Magnetoberfläche (obere Polfläche).
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["x", "y", "z"] as const).map((axis) => {
          const axisLabels = {
            x: "X-axis",
            y: "Y-axis", 
            z: "Z-axis"
          };
          return (
            <div key={axis} className="space-y-2">
              <Label htmlFor={`calc-${axis}`} className="text-sm font-medium">
                {axisLabels[axis]}
              </Label>
              <div className="relative">
                <Input
                  key={`calc-${axis}-${axis === "x" ? x : axis === "y" ? y : z}`}
                  id={`calc-${axis}`}
                  type="number"
                  step="0.1"
                  defaultValue={axis === "x" ? x : axis === "y" ? y : z}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    const currentValue = axis === "x" ? x : axis === "y" ? y : z;
                    if (!isNaN(value)) {
                      onChange(axis, value);
                    } else {
                      e.target.value = String(currentValue);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
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
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Koordinatensystem: X=0, Y=0 in der Magnetmitte, Z=0 an der Magnetoberfläche
      </div>
    </div>
  );
}
