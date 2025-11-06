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
      <CardHeader>
        <CardTitle className="text-base">Feldkomponenten entlang Linie</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-[300px] w-full" data-testid="skeleton-line-chart" />
            <p className="text-sm text-muted-foreground text-center">
              Berechnung läuft...
            </p>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md" data-testid="error-line-chart">
            <p className="text-sm font-medium">Fehler bei der Berechnung</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        )}
        
        {!isLoading && !error && plotlyData && (
          <div className="w-full" data-testid="plotly-line-chart">
            <Plot
              data={plotlyData.data}
              layout={{
                ...plotlyData.layout,
                autosize: true,
                margin: { l: 60, r: 60, t: 60, b: 60 }
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d']
              }}
              style={{ width: '100%', height: '500px' }}
            />
          </div>
        )}
        
        {!isLoading && !error && !plotlyData && (
          <div className="p-6 text-center text-muted-foreground" data-testid="placeholder-line-chart">
            <p className="text-sm">
              Geben Sie Start- und Endpunkt ein, um die Feldkomponenten entlang einer Linie zu berechnen.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
