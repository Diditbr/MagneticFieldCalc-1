import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LineFieldChartProps {
  plotlyData: any | null;
  isLoading: boolean;
  error?: string;
}

export function LineFieldChart({ plotlyData, isLoading, error }: LineFieldChartProps) {
  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base">Feldkomponenten entlang Linie</CardTitle>
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
        
        {!isLoading && !error && plotlyData && (
          <div className="w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0" data-testid="plotly-line-chart">
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
