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
  ) => (
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
          key={`${key}-${dimensions[key as keyof typeof dimensions]}`}
          id={key}
          type="number"
          step="0.1"
          min="0.1"
          defaultValue={dimensions[key as keyof typeof dimensions] || defaultValue}
          onBlur={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value > 0) {
              onDimensionChange(key, value);
            } else {
              e.target.value = String(dimensions[key as keyof typeof dimensions] || defaultValue);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold">Magnet Dimensions</Label>
      </div>

      {magnetType === "bar" && (
        <>
          {renderInput("length", "Length (X-axis)", "Length of the bar magnet along X-axis")}
          {renderInput("width", "Width (Y-axis)", "Width of the bar magnet along Y-axis")}
          {renderInput("height", "Height (Z-axis)", "Height/thickness of the bar magnet along Z-axis (magnetization direction)")}
        </>
      )}

      {magnetType === "cylindrical" && (
        <>
          {renderInput("diameter", "Diameter (X-Y plane)", "Diameter of the cylinder in X-Y plane")}
          {renderInput("length", "Length (Z-axis)", "Length/height of the cylinder along Z-axis (magnetization direction)")}
        </>
      )}

      {magnetType === "rectangular" && (
        <>
          {renderInput("length", "Length (X-axis)", "Length of the rectangular magnet along X-axis")}
          {renderInput("width", "Width (Y-axis)", "Width of the rectangular magnet along Y-axis")}
          {renderInput("height", "Height (Z-axis)", "Height/thickness of the rectangular magnet along Z-axis (magnetization direction)")}
        </>
      )}

      {magnetType === "ring" && (
        <>
          {renderInput("diameter", "Outer Diameter (X-Y plane)", "Outer diameter of the ring in X-Y plane")}
          {renderInput("innerDiameter", "Inner Diameter (X-Y plane)", "Inner diameter of the ring in X-Y plane")}
          {renderInput("thickness", "Thickness (Z-axis)", "Axial thickness of the ring along Z-axis (magnetization direction)")}
        </>
      )}
    </div>
  );
}
