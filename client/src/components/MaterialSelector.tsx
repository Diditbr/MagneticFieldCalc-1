import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { materialPresets, type MaterialPreset } from "@shared/schema";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MaterialSelectorProps {
  selectedMaterial: MaterialPreset;
  customMagnetization: number;
  onMaterialChange: (material: MaterialPreset) => void;
  onCustomMagnetizationChange: (value: number) => void;
}

export function MaterialSelector({
  selectedMaterial,
  customMagnetization,
  onMaterialChange,
  onCustomMagnetizationChange,
}: MaterialSelectorProps) {
  const isCustom = selectedMaterial === "Custom";
  const displayMagnetization = isCustom 
    ? customMagnetization 
    : materialPresets[selectedMaterial];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="material" className="text-sm font-semibold">
            Material Preset
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Select a common magnet material or choose Custom to enter your own magnetization value
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select value={selectedMaterial} onValueChange={(v) => onMaterialChange(v as MaterialPreset)}>
          <SelectTrigger id="material" data-testid="select-material">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(materialPresets).map((material) => (
              <SelectItem key={material} value={material} data-testid={`option-material-${material}`}>
                {material}
                {material !== "Custom" && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                    ({materialPresets[material as MaterialPreset]} T)
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCustom && (
        <div className="space-y-2">
          <Label htmlFor="custom-magnetization" className="text-sm font-medium">
            Custom Magnetization (T)
          </Label>
          <Input
            id="custom-magnetization"
            type="number"
            step="0.01"
            min="0.01"
            value={customMagnetization}
            onChange={(e) => onCustomMagnetizationChange(parseFloat(e.target.value) || 0.01)}
            className="font-mono"
            data-testid="input-custom-magnetization"
          />
        </div>
      )}

      <div className="p-3 rounded-md bg-muted/50">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Magnetization Strength
        </div>
        <div className="text-lg font-mono font-semibold" data-testid="text-magnetization-value">
          {displayMagnetization.toFixed(2)} T
        </div>
      </div>
    </div>
  );
}
