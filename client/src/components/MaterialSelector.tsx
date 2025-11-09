import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MaterialSelectorProps {
  magnetization: number;
  onMagnetizationChange: (value: number) => void;
}

export function MaterialSelector({
  magnetization,
  onMagnetizationChange,
}: MaterialSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="remanence" className="text-sm font-semibold">
          Remanenz (mT)
        </Label>
        <Input
          key={`remanence-${magnetization}`}
          id="remanence"
          type="number"
          step="10"
          min="1"
          defaultValue={(magnetization * 1000).toFixed(0)}
          onBlur={(e) => {
            const valueInMT = parseFloat(e.target.value);
            if (!isNaN(valueInMT) && valueInMT > 0) {
              onMagnetizationChange(valueInMT / 1000);
            } else {
              e.target.value = String((magnetization * 1000).toFixed(0));
            }
          }}
          className="font-mono"
          data-testid="input-remanence"
        />
      </div>

      <div className="p-3 rounded-md bg-muted/50">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Magnetisierung
        </div>
        <div className="text-lg font-mono font-semibold" data-testid="text-magnetization-value">
          {magnetization.toFixed(3)} T = {(magnetization * 1000).toFixed(0)} mT
        </div>
      </div>
    </div>
  );
}
