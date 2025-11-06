import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Circle, Square, Disc, Slice } from "lucide-react";
import type { MagnetType } from "@shared/schema";

interface MagnetTypeSelectorProps {
  value: MagnetType;
  onChange: (value: MagnetType) => void;
}

const magnetTypeConfig = [
  { value: "rectangular" as const, label: "Vierkantmagnet", icon: Square },
  { value: "cylindrical" as const, label: "Rundmagnet", icon: Circle },
  { value: "ring" as const, label: "Ringmagnet", icon: Disc },
  { value: "ring_segment" as const, label: "Ringsegment", icon: Slice },
];

export function MagnetTypeSelector({ value, onChange }: MagnetTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Magnettyp</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {magnetTypeConfig.map(({ value: typeValue, label, icon: Icon }) => (
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
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
