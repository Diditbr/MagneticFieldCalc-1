import { useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface LineFieldChartProps {
  plotlyData: any | null;
  isLoading: boolean;
  error?: string;
}

export function LineFieldChart({ plotlyData, isLoading, error }: LineFieldChartProps) {
  const [showBx, setShowBx] = useState(true);
  const [showBy, setShowBy] = useState(true);
  const [showBz, setShowBz] = useState(true);

  const filteredData = useMemo(() => {
    if (!plotlyData || !plotlyData.data) return null;
    
    const filtered = plotlyData.data.filter((trace: any) => {
      if (trace.name === 'Bx') return showBx;
      if (trace.name === 'By') return showBy;
      if (trace.name === 'Bz') return showBz;
      return true;
    });
    
    return { ...plotlyData, data: filtered };
  }, [plotlyData, showBx, showBy, showBz]);

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-sm sm:text-base">Feldkomponenten entlang Linie</CardTitle>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="showBx"
                checked={showBx}
                onCheckedChange={(checked) => setShowBx(checked === true)}
                data-testid="checkbox-show-bx"
              />
              <Label htmlFor="showBx" className="text-xs font-normal cursor-pointer">Bx</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="showBy"
                checked={showBy}
                onCheckedChange={(checked) => setShowBy(checked === true)}
                data-testid="checkbox-show-by"
              />
              <Label htmlFor="showBy" className="text-xs font-normal cursor-pointer">By</Label>
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
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-[250px] sm:h-[300px] w-full" data-testid="skeleton-line-chart" />
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Berechnung läuft...
            </p>
          </div>
        )}
        
        {error && (
          <div className="p-3 sm:p-4 bg-destructive/10 text-destructive rounded-md" data-testid="error-line-chart">
            <p className="text-xs sm:text-sm font-medium">Fehler bei der Berechnung</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        )}
        
        {!isLoading && !error && filteredData && (
          <div className="w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0" data-testid="plotly-line-chart">
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
          <div className="p-4 sm:p-6 text-center text-muted-foreground" data-testid="placeholder-line-chart">
            <p className="text-xs sm:text-sm">
              Geben Sie Start- und Endpunkt ein, um die Feldkomponenten entlang einer Linie zu berechnen.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
