import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LineFieldChartProps {
  imageData: string | null;
  isLoading: boolean;
  error?: string;
}

export function LineFieldChart({ imageData, isLoading, error }: LineFieldChartProps) {
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
        
        {!isLoading && !error && imageData && (
          <div className="w-full" data-testid="image-line-chart">
            <img
              src={`data:image/png;base64,${imageData}`}
              alt="Feldkomponenten entlang Linie"
              className="w-full h-auto rounded-md"
            />
          </div>
        )}
        
        {!isLoading && !error && !imageData && (
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
