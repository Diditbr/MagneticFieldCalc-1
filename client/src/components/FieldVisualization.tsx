import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { MagnetType } from "@shared/schema";

interface FieldVisualizationProps {
  magnetType: MagnetType;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    innerDiameter?: number;
    thickness?: number;
  };
  calcX: number;
  calcY: number;
  calcZ: number;
  Bx?: number;
  By?: number;
  Bz?: number;
  numFluxLines: number;
}

export function FieldVisualization({
  magnetType,
  dimensions,
  calcX,
  calcY,
  calcZ,
  Bx = 0,
  By = 0,
  Bz = 0,
  numFluxLines,
}: FieldVisualizationProps) {
  const [visualizationImage, setVisualizationImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [magnetization, setMagnetization] = useState(1.32); // Default NdFeB N42
  
  // Fetch visualization from backend when magnet configuration changes
  useEffect(() => {
    const fetchVisualization = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/field-visualization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: magnetType,
            magnetization,
            ...dimensions,
            calcX: calcX / 1000, // Convert mm to meters
            calcZ: calcZ / 1000, // Convert mm to meters
            numFluxLines: numFluxLines, // Pass number of flux lines to backend
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setVisualizationImage(data.image);
        } else {
          console.error('Failed to fetch visualization');
        }
      } catch (error) {
        console.error('Failed to fetch visualization:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVisualization();
  }, [magnetType, dimensions, magnetization, calcX, calcZ, numFluxLines]);

  return (
    <Card className="p-4 space-y-3" data-testid="card-field-visualization">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Field Visualization</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 border-2 border-[#ef4444] bg-[#ef444420]"></div>
              <span className="text-muted-foreground">Magnet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Calc Point</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-purple-600">
                <line x1="4" y1="16" x2="4" y2="4" stroke="currentColor" strokeWidth="2.5" />
                <polygon points="4,4 1,8 7,8" fill="currentColor" />
              </svg>
              <span className="text-muted-foreground">Magnetization</span>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="w-full h-96 flex items-center justify-center bg-card rounded-md">
            <p className="text-muted-foreground">Generating visualization...</p>
          </div>
        ) : visualizationImage ? (
          <img
            src={`data:image/png;base64,${visualizationImage}`}
            alt="Magnetic field visualization"
            className="w-full rounded-md bg-card"
            data-testid="img-field-visualization"
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-card rounded-md">
            <p className="text-muted-foreground">Loading visualization...</p>
          </div>
        )}
        <div className="text-xs text-muted-foreground text-center">
          2D cross-section showing field lines and calculation point (X-Z plane)
        </div>
      </div>
    </Card>
  );
}
