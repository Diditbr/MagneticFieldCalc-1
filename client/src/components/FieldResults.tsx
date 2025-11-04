import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import { formatFieldValue } from "@/lib/units";
import type { FieldUnit } from "@shared/schema";

interface FieldResultsProps {
  Bx: number;
  By: number;
  Bz: number;
  magnitude: number;
  distance: number;
  fieldUnit: FieldUnit;
  lengthUnit: string;
  calcX: number;
  calcY: number;
  calcZ: number;
}

export function FieldResults({
  Bx,
  By,
  Bz,
  magnitude,
  distance,
  fieldUnit,
  lengthUnit,
  calcX,
  calcY,
  calcZ,
}: FieldResultsProps) {
  const components = [
    { label: "Bx", value: Bx, icon: ArrowRight, color: "text-chart-1" },
    { label: "By", value: By, icon: ArrowUp, color: "text-chart-2" },
    { label: "Bz", value: Bz, icon: ArrowUp, color: "text-chart-3" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Feldergebnisse</h3>
        <Badge variant="secondary" className="font-mono text-xs" data-testid="badge-coordinates">
          x: {calcX.toFixed(2)}, y: {calcY.toFixed(2)}, z: {calcZ.toFixed(2)} {lengthUnit}
        </Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-1 mb-4">
          <div className="text-sm font-medium text-muted-foreground">Total Field Magnitude</div>
          <div className="text-4xl font-mono font-bold" data-testid="text-magnitude">
            {formatFieldValue(magnitude, fieldUnit)}
            <span className="text-xl ml-2 text-muted-foreground">{fieldUnit}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          {components.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
              </div>
              <div className="text-2xl font-mono font-semibold" data-testid={`text-${label.toLowerCase()}`}>
                {formatFieldValue(value, fieldUnit)}
              </div>
              <div className="text-xs text-muted-foreground">{fieldUnit}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
