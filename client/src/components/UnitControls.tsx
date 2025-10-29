import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fieldUnits, type FieldUnit } from "@shared/schema";

interface UnitControlsProps {
  fieldUnit: FieldUnit;
  onFieldUnitChange: (unit: FieldUnit) => void;
}

export function UnitControls({ fieldUnit, onFieldUnitChange }: UnitControlsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Field Units</Label>
      <div className="flex gap-1 p-1 bg-muted rounded-md">
        {fieldUnits.map((unit) => (
          <Button
            key={unit}
            variant={fieldUnit === unit ? "default" : "ghost"}
            size="sm"
            onClick={() => onFieldUnitChange(unit)}
            className="flex-1 text-xs font-mono no-default-hover-elevate no-default-active-elevate"
            data-testid={`button-field-unit-${unit}`}
          >
            {unit}
          </Button>
        ))}
      </div>
    </div>
  );
}
