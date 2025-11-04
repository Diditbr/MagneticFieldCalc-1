import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { MagnetType, MagnetizationType } from "@shared/schema";

interface MagnetizationControlsProps {
  magnetType: MagnetType;
  magnetizationType: MagnetizationType;
  magnetizationAngle: number;
  onMagnetizationTypeChange: (type: MagnetizationType) => void;
  onMagnetizationAngleChange: (angle: number) => void;
}

export function MagnetizationControls({
  magnetType,
  magnetizationType,
  magnetizationAngle,
  onMagnetizationTypeChange,
  onMagnetizationAngleChange,
}: MagnetizationControlsProps) {
  // Only show for cylindrical and ring magnets
  if (magnetType !== "cylindrical" && magnetType !== "ring") {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="diametral-magnetization"
          checked={magnetizationType === "diametral"}
          onChange={(e) =>
            onMagnetizationTypeChange(e.target.checked ? "diametral" : "axial")
          }
          className="h-4 w-4"
          data-testid="checkbox-diametral"
        />
        <Label htmlFor="diametral-magnetization" className="text-sm font-medium cursor-pointer">
          Diametrale Magnetisierung
        </Label>
        <Badge variant="secondary" className="text-xs">
          {magnetizationType === "axial" ? "Axial (Z)" : "Diametral (X-Z)"}
        </Badge>
      </div>

      {magnetizationType === "diametral" && (
        <div className="space-y-3 pl-7">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Winkel in X-Z-Ebene
            </Label>
            <span className="text-sm font-mono font-semibold">
              {magnetizationAngle.toFixed(0)}°
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={magnetizationAngle}
              onChange={(e) => onMagnetizationAngleChange(Number(e.target.value))}
              className="flex-1"
              data-testid="input-magnetization-angle"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            0° = +X (rechts), 90° = +Z (oben), 180° = -X (links), 270° = -Z (unten)
          </div>
        </div>
      )}
    </div>
  );
}
