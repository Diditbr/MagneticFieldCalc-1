import { useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface CircleFieldChartProps {
  plotlyData: any | null;
  isLoading: boolean;
  error?: string;
  radius: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  numSamples: number;
  onRadiusChange: (value: number) => void;
  onCenterXChange: (value: number) => void;
  onCenterYChange: (value: number) => void;
  onCenterZChange: (value: number) => void;
  onNumSamplesChange: (value: number) => void;
  enableCircle2?: boolean;
  circle2Radius?: number;
  circle2CenterX?: number;
  circle2CenterY?: number;
  circle2CenterZ?: number;
  onEnableCircle2Change?: (value: boolean) => void;
  onCircle2RadiusChange?: (value: number) => void;
  onCircle2CenterXChange?: (value: number) => void;
  onCircle2CenterYChange?: (value: number) => void;
  onCircle2CenterZChange?: (value: number) => void;
}

export function CircleFieldChart({ 
  plotlyData, 
  isLoading, 
  error,
  radius,
  centerX,
  centerY,
  centerZ,
  numSamples,
  onRadiusChange,
  onCenterXChange,
  onCenterYChange,
  onCenterZChange,
  onNumSamplesChange,
  enableCircle2 = false,
  circle2Radius = 15,
  circle2CenterX = 0,
  circle2CenterY = 0,
  circle2CenterZ = 0,
  onEnableCircle2Change,
  onCircle2RadiusChange,
  onCircle2CenterXChange,
  onCircle2CenterYChange,
  onCircle2CenterZChange
}: CircleFieldChartProps) {
  const [showBr, setShowBr] = useState(true);
  const [showBt, setShowBt] = useState(true);
  const [showBz, setShowBz] = useState(true);

  const filteredData = useMemo(() => {
    if (!plotlyData || !plotlyData.data) return null;
    
    const filtered = plotlyData.data.filter((trace: any) => {
      const name = trace.name || '';
      if (name.startsWith('Br')) return showBr;
      if (name.startsWith('Bt')) return showBt;
      if (name.startsWith('Bz')) return showBz;
      return true;
    });
    
    return { ...plotlyData, data: filtered };
  }, [plotlyData, showBr, showBt, showBz]);

  return (
    <>
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center justify-end gap-3 sm:gap-4 pt-2">
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="showBr"
              checked={showBr}
              onCheckedChange={(checked) => setShowBr(checked === true)}
              data-testid="checkbox-show-br"
            />
            <Label htmlFor="showBr" className="text-xs font-normal cursor-pointer">Br</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="showBt"
              checked={showBt}
              onCheckedChange={(checked) => setShowBt(checked === true)}
              data-testid="checkbox-show-bt"
            />
            <Label htmlFor="showBt" className="text-xs font-normal cursor-pointer">Bt</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="showBz"
              checked={showBz}
              onCheckedChange={(checked) => setShowBz(checked === true)}
              data-testid="checkbox-show-bz"
            />
            <Label htmlFor="showBz" className="text-xs font-normal cursor-pointer">Bz</Label>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="circleRadius" className="text-xs font-medium">Radius (mm)</Label>
            <Input
              id="circleRadius"
              type="number"
              step="0.1"
              value={radius}
              onChange={(e) => onRadiusChange(parseFloat(e.target.value) || 0)}
              className="font-mono text-xs h-8"
              data-testid="input-circle-radius"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="circleCenterX" className="text-xs font-medium">Zentrum X (mm)</Label>
            <Input
              id="circleCenterX"
              type="number"
              step="0.01"
              value={centerX}
              onChange={(e) => onCenterXChange(parseFloat(e.target.value) || 0)}
              className="font-mono text-xs h-8"
              data-testid="input-circle-center-x"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="circleCenterY" className="text-xs font-medium">Zentrum Y (mm)</Label>
            <Input
              id="circleCenterY"
              type="number"
              step="0.01"
              value={centerY}
              onChange={(e) => onCenterYChange(parseFloat(e.target.value) || 0)}
              className="font-mono text-xs h-8"
              data-testid="input-circle-center-y"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="circleCenterZ" className="text-xs font-medium">Zentrum Z (mm)</Label>
            <Input
              id="circleCenterZ"
              type="number"
              step="0.01"
              value={centerZ}
              onChange={(e) => onCenterZChange(parseFloat(e.target.value) || 0)}
              className="font-mono text-xs h-8"
              data-testid="input-circle-center-z"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="numSamples" className="text-xs font-medium">Auflösung</Label>
            <Input
              id="numSamples"
              type="number"
              min="36"
              max="1440"
              step="36"
              value={numSamples}
              onChange={(e) => onNumSamplesChange(parseInt(e.target.value) || 360)}
              className="font-mono text-xs h-8"
              data-testid="input-circle-num-samples"
            />
          </div>
        </div>

        {onEnableCircle2Change && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enableCircle2"
                  checked={enableCircle2}
                  onCheckedChange={(checked) => onEnableCircle2Change(checked === true)}
                  data-testid="checkbox-enable-circle2"
                />
                <Label htmlFor="enableCircle2" className="text-sm cursor-pointer">
                  Zweiten Kreis hinzufügen
                </Label>
              </div>

              {enableCircle2 && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="circle2Radius" className="text-xs font-medium">Radius 2 (mm)</Label>
                      <Input
                        id="circle2Radius"
                        type="number"
                        step="0.01"
                        value={circle2Radius}
                        onChange={(e) => onCircle2RadiusChange?.(parseFloat(e.target.value) || 0)}
                        className="font-mono text-xs h-8"
                        data-testid="input-circle2-radius"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="circle2CenterX" className="text-xs font-medium">X2 (mm)</Label>
                      <Input
                        id="circle2CenterX"
                        type="number"
                        step="0.01"
                        value={circle2CenterX}
                        onChange={(e) => onCircle2CenterXChange?.(parseFloat(e.target.value) || 0)}
                        className="font-mono text-xs h-8"
                        data-testid="input-circle2-center-x"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="circle2CenterY" className="text-xs font-medium">Y2 (mm)</Label>
                      <Input
                        id="circle2CenterY"
                        type="number"
                        step="0.01"
                        value={circle2CenterY}
                        onChange={(e) => onCircle2CenterYChange?.(parseFloat(e.target.value) || 0)}
                        className="font-mono text-xs h-8"
                        data-testid="input-circle2-center-y"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="circle2CenterZ" className="text-xs font-medium">Z2 (mm)</Label>
                      <Input
                        id="circle2CenterZ"
                        type="number"
                        step="0.01"
                        value={circle2CenterZ}
                        onChange={(e) => onCircle2CenterZChange?.(parseFloat(e.target.value) || 0)}
                        className="font-mono text-xs h-8"
                        data-testid="input-circle2-center-z"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-[250px] sm:h-[300px] w-full" data-testid="skeleton-circle-chart" />
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Kreisförmige Messung wird berechnet...
            </p>
          </div>
        )}
        
        {error && (
          <div className="p-3 sm:p-4 bg-destructive/10 text-destructive rounded-md" data-testid="error-circle-chart">
            <p className="text-xs sm:text-sm font-medium">Fehler bei der Berechnung</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        )}
        
        {!isLoading && !error && filteredData && (
          <div className="w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0" data-testid="plotly-circle-chart">
            <div className="min-w-[600px] sm:min-w-0">
              <Plot
                data={filteredData.data}
                layout={{
                  ...filteredData.layout,
                  autosize: true,
                  margin: { l: 50, r: 30, t: 30, b: 50 },
                  font: { size: 11 }
                }}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                  scrollZoom: true
                }}
                style={{ width: '100%', height: '350px' }}
                useResizeHandler={true}
                className="sm:!h-[500px]"
              />
            </div>
          </div>
        )}
        
        {!isLoading && !error && !plotlyData && (
          <div className="p-4 sm:p-6 text-center text-muted-foreground" data-testid="placeholder-circle-chart">
            <p className="text-xs sm:text-sm">
              Legen Sie Radius und Zentrum fest, um die Feldkomponenten auf einem konzentrischen Kreis zu berechnen.
            </p>
          </div>
        )}
      </CardContent>
    </>
  );
}
