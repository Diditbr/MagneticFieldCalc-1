import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Box, Circle, Square, Disc, AlertTriangle } from "lucide-react";
import type { MagnetType } from "@shared/schema";

interface MagnetTypeSelectorProps {
  value: MagnetType;
  onChange: (value: MagnetType) => void;
}

const magnetTypeConfig = [
  { value: "bar" as const, label: "Bar Magnet", icon: Box },
  { value: "cylindrical" as const, label: "Cylindrical", icon: Circle },
  { value: "rectangular" as const, label: "Rectangular", icon: Square },
  { value: "ring" as const, label: "Ring Magnet", icon: Disc, warning: true },
];

export function MagnetTypeSelector({ value, onChange }: MagnetTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Magnettyp</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 gap-2">
        {magnetTypeConfig.map(({ value: typeValue, label, icon: Icon, warning }) => (
          <label
            key={typeValue}
            className={`
              flex items-center gap-3 p-4 rounded-md border cursor-pointer transition-colors
              hover-elevate active-elevate-2
              ${value === typeValue 
                ? "border-primary bg-primary/5" 
                : "border-border bg-card"
              }
            `}
            data-testid={`radio-magnet-${typeValue}`}
          >
            <RadioGroupItem value={typeValue} id={typeValue} className="sr-only" />
            <Icon className={`h-5 w-5 ${value === typeValue ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex flex-col gap-0.5 flex-1">
              <span className={`text-sm font-medium ${value === typeValue ? "text-foreground" : "text-foreground"}`}>
                {label}
              </span>
              {warning && typeValue === "ring" && (
                <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Visualisierung in Entwicklung
                </span>
              )}
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
