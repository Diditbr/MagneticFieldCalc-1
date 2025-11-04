import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LineInputsProps {
  startX: number;
  startY: number;
  startZ: number;
  endX: number;
  endY: number;
  endZ: number;
  onStartXChange: (value: number) => void;
  onStartYChange: (value: number) => void;
  onStartZChange: (value: number) => void;
  onEndXChange: (value: number) => void;
  onEndYChange: (value: number) => void;
  onEndZChange: (value: number) => void;
  lengthUnit: string;
}

export function LineInputs({
  startX,
  startY,
  startZ,
  endX,
  endY,
  endZ,
  onStartXChange,
  onStartYChange,
  onStartZChange,
  onEndXChange,
  onEndYChange,
  onEndZChange,
  lengthUnit,
}: LineInputsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Linienfeld-Berechnung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="text-sm font-medium">Startpunkt ({lengthUnit})</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="line-start-x" className="text-xs">
                X
              </Label>
              <Input
                id="line-start-x"
                data-testid="input-line-start-x"
                type="number"
                value={startX}
                onChange={(e) => onStartXChange(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="line-start-y" className="text-xs">
                Y
              </Label>
              <Input
                id="line-start-y"
                data-testid="input-line-start-y"
                type="number"
                value={startY}
                onChange={(e) => onStartYChange(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="line-start-z" className="text-xs">
                Z
              </Label>
              <Input
                id="line-start-z"
                data-testid="input-line-start-z"
                type="number"
                value={startZ}
                onChange={(e) => onStartZChange(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Endpunkt ({lengthUnit})</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="line-end-x" className="text-xs">
                X
              </Label>
              <Input
                id="line-end-x"
                data-testid="input-line-end-x"
                type="number"
                value={endX}
                onChange={(e) => onEndXChange(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="line-end-y" className="text-xs">
                Y
              </Label>
              <Input
                id="line-end-y"
                data-testid="input-line-end-y"
                type="number"
                value={endY}
                onChange={(e) => onEndYChange(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="line-end-z" className="text-xs">
                Z
              </Label>
              <Input
                id="line-end-z"
                data-testid="input-line-end-z"
                type="number"
                value={endZ}
                onChange={(e) => onEndZChange(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
