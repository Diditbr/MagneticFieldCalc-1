import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lengthUnits, type LengthUnit, type MagnetType } from "@shared/schema";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DimensionInputsProps {
  magnetType: MagnetType;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    innerDiameter?: number;
    thickness?: number;
    phi1?: number;
    phi2?: number;
  };
  lengthUnit: LengthUnit;
  onDimensionChange: (key: string, value: number) => void;
  onLengthUnitChange: (unit: LengthUnit) => void;
}

export function DimensionInputs({
  magnetType,
  dimensions,
  lengthUnit,
  onDimensionChange,
  onLengthUnitChange,
}: DimensionInputsProps) {
  const renderInput = (
    key: string,
    label: string,
    tooltip: string,
    defaultValue: number = 10
  ) => {
    const currentValue = dimensions[key as keyof typeof dimensions] || defaultValue;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {label}
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex gap-2">
          <Input
            id={key}
            type="number"
            step="0.1"
            min="0.1"
            defaultValue={currentValue}
            onBlur={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                onDimensionChange(key, value);
              } else {
                // Reset to current value if invalid
                e.target.value = String(currentValue);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="font-mono"
            data-testid={`input-${key}`}
          />
          <Select value={lengthUnit} onValueChange={(v) => onLengthUnitChange(v as LengthUnit)}>
            <SelectTrigger className="w-20" data-testid="select-length-unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lengthUnits.map((unit) => (
                <SelectItem key={unit} value={unit} data-testid={`option-unit-${unit}`}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Magnetabmessungen</Label>
        <div className="flex items-center gap-1.5 text-xs bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-md border border-purple-200 dark:border-purple-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7"/>
          </svg>
          <span className="font-medium">Magnetisierung: Z-Achse</span>
        </div>
      </div>

      {magnetType === "rectangular" && (
        <>
          {renderInput("length", "Länge (X-Achse)", "Länge des Vierkantonmagneten entlang der X-Achse")}
          {renderInput("width", "Breite (Y-Achse)", "Breite des Vierkantmagneten entlang der Y-Achse")}
          {renderInput("height", "Höhe (Z-Achse)", "Höhe/Dicke des Vierkantmagneten entlang der Z-Achse (Magnetisierungsrichtung)")}
        </>
      )}

      {magnetType === "cylindrical" && (
        <>
          {renderInput("diameter", "Durchmesser (X-Y Ebene)", "Durchmesser des Zylinders in der X-Y Ebene")}
          {renderInput("length", "Länge (Z-Achse)", "Länge/Höhe des Zylinders entlang der Z-Achse (Magnetisierungsrichtung)")}
        </>
      )}

      {magnetType === "ring" && (
        <>
          {renderInput("diameter", "Außendurchmesser (X-Y Ebene)", "Außendurchmesser des Rings in der X-Y Ebene")}
          {renderInput("innerDiameter", "Innendurchmesser (X-Y Ebene)", "Innendurchmesser des Rings in der X-Y Ebene")}
          {renderInput("thickness", "Dicke (Z-Achse)", "Axiale Dicke des Rings entlang der Z-Achse (Magnetisierungsrichtung)")}
        </>
      )}

      {magnetType === "ring_segment" && (
        <>
          {renderInput("diameter", "Außendurchmesser (X-Y Ebene)", "Außendurchmesser des Ringsegments in der X-Y Ebene")}
          {renderInput("innerDiameter", "Innendurchmesser (X-Y Ebene)", "Innendurchmesser des Ringsegments in der X-Y Ebene")}
          {renderInput("thickness", "Dicke (Z-Achse)", "Axiale Dicke des Ringsegments entlang der Z-Achse")}
          {renderInput("phi1", "Startwinkel φ₁ (°)", "Startwinkel des Ringsegments in Grad (0-360°)", 0)}
          {renderInput("phi2", "Endwinkel φ₂ (°)", "Endwinkel des Ringsegments in Grad (0-360°)", 90)}
        </>
      )}
    </div>
  );
}
