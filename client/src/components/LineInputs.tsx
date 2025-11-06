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
        <p className="text-xs text-muted-foreground mt-1">
          Koordinatensystem: X=0, Y=0 in der Magnetmitte, Z=0 an der Magnetoberfläche
        </p>
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
                defaultValue={startX}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    onStartXChange(value);
                  } else {
                    e.target.value = String(startX);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
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
                defaultValue={startY}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    onStartYChange(value);
                  } else {
                    e.target.value = String(startY);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
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
                defaultValue={startZ}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    onStartZChange(value);
                  } else {
                    e.target.value = String(startZ);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
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
                defaultValue={endX}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    onEndXChange(value);
                  } else {
                    e.target.value = String(endX);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
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
                defaultValue={endY}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    onEndYChange(value);
                  } else {
                    e.target.value = String(endY);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
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
                defaultValue={endZ}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    onEndZChange(value);
                  } else {
                    e.target.value = String(endZ);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
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
