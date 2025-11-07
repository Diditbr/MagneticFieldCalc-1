import { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { Card } from "@/components/ui/card";
import type { MagnetType, MagnetizationType } from "@shared/schema";

interface FieldVisualizationProps {
  magnetType: MagnetType;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    innerDiameter?: number;
    thickness?: number;
    phi1?: number;
    phi2?: number;
  };
  magnetization: number;
  magnetizationType: MagnetizationType;
  magnetizationAngle: number;
  calcX: number;
  calcY: number;
  calcZ: number;
  Bx?: number;
  By?: number;
  Bz?: number;
  numFluxLines: number;
  maxColorScale?: number;
  lineStartX?: number;
  lineStartY?: number;
  lineStartZ?: number;
  lineEndX?: number;
  lineEndY?: number;
  lineEndZ?: number;
}

export function FieldVisualization({
  magnetType,
  dimensions,
  magnetization,
  magnetizationType,
  magnetizationAngle,
  calcX,
  calcY,
  calcZ,
  Bx = 0,
  By = 0,
  Bz = 0,
  numFluxLines,
  maxColorScale,
  lineStartX,
  lineStartY,
  lineStartZ,
  lineEndX,
  lineEndY,
  lineEndZ,
}: FieldVisualizationProps) {
  const [plotlyData, setPlotlyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch visualization from backend when magnet configuration changes
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce: wait 500ms after last change before fetching
    debounceTimerRef.current = setTimeout(() => {
      const fetchVisualization = async () => {
      setIsLoading(true);
      try {
        // Convert all dimensions from mm to meters for backend
        // IMPORTANT: phi1 and phi2 are angles in degrees, NOT lengths - do not convert
        const dimensionsInMeters: any = {};
        Object.entries(dimensions).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'phi1' || key === 'phi2') {
              dimensionsInMeters[key] = value; // Keep angles in degrees
            } else {
              dimensionsInMeters[key] = value / 1000; // mm to m
            }
          }
        });
        
        const requestBody: any = {
          type: magnetType,
          magnetization,
          magnetizationType,
          magnetizationAngle,
          ...dimensionsInMeters, // Send dimensions in meters
          calcX: calcX / 1000, // Convert mm to meters
          calcZ: calcZ / 1000, // Convert mm to meters
          numFluxLines: numFluxLines, // Pass number of flux lines to backend
        };
        
        // Add maxColorScale only if it's defined
        if (maxColorScale !== undefined && maxColorScale > 0) {
          requestBody.maxColorScale = maxColorScale;
        }
        
        // Add line coordinates if defined (convert mm to meters)
        if (lineStartX !== undefined && lineStartZ !== undefined && 
            lineEndX !== undefined && lineEndZ !== undefined) {
          requestBody.lineStartX = lineStartX / 1000;
          requestBody.lineStartY = lineStartY !== undefined ? lineStartY / 1000 : 0;
          requestBody.lineStartZ = lineStartZ / 1000;
          requestBody.lineEndX = lineEndX / 1000;
          requestBody.lineEndY = lineEndY !== undefined ? lineEndY / 1000 : 0;
          requestBody.lineEndZ = lineEndZ / 1000;
        }
        
        const response = await fetch('/api/field-visualization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Parse Plotly JSON
          if (data.plotlyJson) {
            const plotData = JSON.parse(data.plotlyJson);
            setPlotlyData(plotData);
          }
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
    }, 500); // Wait 500ms before making request
    
    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [magnetType, dimensions, magnetization, magnetizationType, magnetizationAngle, calcX, calcZ, numFluxLines, maxColorScale, lineStartX, lineStartY, lineStartZ, lineEndX, lineEndY, lineEndZ]);

  const getViewDescription = () => {
    if ((magnetType === 'ring' || magnetType === 'ring_segment' || magnetType === 'cylindrical') && 
        (magnetizationType === 'radial' || magnetizationType === 'diametral')) {
      return 'X-Y Ebene (Draufsicht)';
    }
    return 'X-Z Ebene (Seitenansicht)';
  };

  return (
    <Card className="p-3 sm:p-4 space-y-2 sm:space-y-3" data-testid="card-field-visualization">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold">Feldvisualisierung</h3>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 sm:w-4 sm:h-2 border-2 border-[#ef4444] bg-[#ef444420]"></div>
              <span className="text-muted-foreground">Magnet</span>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="w-full h-64 sm:h-96 flex items-center justify-center bg-card rounded-md">
            <p className="text-xs sm:text-sm text-muted-foreground">Visualisierung wird generiert...</p>
          </div>
        ) : plotlyData ? (
          <div className="w-full" data-testid="plotly-field-visualization">
            <Plot
              data={plotlyData.data}
              layout={{
                ...plotlyData.layout,
                autosize: true,
                margin: { l: 50, r: 50, t: 50, b: 50 }
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d']
              }}
              style={{ width: '100%', height: '400px' }}
              useResizeHandler={true}
              className="sm:!h-[600px]"
            />
          </div>
        ) : (
          <div className="w-full h-64 sm:h-96 flex items-center justify-center bg-card rounded-md">
            <p className="text-xs sm:text-sm text-muted-foreground">Visualisierung laden...</p>
          </div>
        )}
        <div className="text-xs text-muted-foreground text-center">
          Interaktive Magnetfeldvisualisierung ({getViewDescription()})
        </div>
      </div>
    </Card>
  );
}
