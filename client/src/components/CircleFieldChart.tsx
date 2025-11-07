import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  onNumSamplesChange
}: CircleFieldChartProps) {
  return (
    <>
      <CardContent className="p-0 space-y-4">
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
        
        {!isLoading && !error && plotlyData && (
          <div className="w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0" data-testid="plotly-circle-chart">
            <div className="min-w-[600px] sm:min-w-0">
              <Plot
                data={plotlyData.data}
                layout={{
                  ...plotlyData.layout,
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
