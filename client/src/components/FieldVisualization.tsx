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
    axisTiltAngle?: number;
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
  circleRadius?: number;
  circleCenterX?: number;
  circleCenterY?: number;
  circleCenterZ?: number;
  enableLine2?: boolean;
  line2StartX?: number;
  line2StartY?: number;
  line2StartZ?: number;
  line2EndX?: number;
  line2EndY?: number;
  line2EndZ?: number;
  enableCircle2?: boolean;
  circle2Radius?: number;
  circle2CenterX?: number;
  circle2CenterY?: number;
  circle2CenterZ?: number;
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
  circleRadius,
  circleCenterX,
  circleCenterY,
  circleCenterZ,
  enableLine2 = false,
  line2StartX,
  line2StartY,
  line2StartZ,
  line2EndX,
  line2EndY,
  line2EndZ,
  enableCircle2 = false,
  circle2Radius,
  circle2CenterX,
  circle2CenterY,
  circle2CenterZ,
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
        // IMPORTANT: phi1, phi2, and numPoles are NOT lengths - do not convert
        const dimensionsInMeters: any = {};
        Object.entries(dimensions).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'phi1' || key === 'phi2' || key === 'numPoles' || key === 'axisTiltAngle') {
              dimensionsInMeters[key] = value; // Keep angles and counts as-is
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
          calcY: calcY / 1000, // Convert mm to meters
          calcZ: calcZ / 1000, // Convert mm to meters
          numFluxLines: numFluxLines, // Pass number of flux lines to backend
        };
        
        // Add maxColorScale only if it's defined
        if (maxColorScale !== undefined && maxColorScale > 0) {
          requestBody.maxColorScale = maxColorScale;
        }
        
        // Add line coordinates if defined (convert mm to meters)
        // Send line coordinates for both X-Y and X-Z planes
        if (lineStartX !== undefined && lineEndX !== undefined) {
          requestBody.lineStartX = lineStartX / 1000;
          requestBody.lineStartY = lineStartY !== undefined ? lineStartY / 1000 : 0;
          requestBody.lineStartZ = lineStartZ !== undefined ? lineStartZ / 1000 : 0;
          requestBody.lineEndX = lineEndX / 1000;
          requestBody.lineEndY = lineEndY !== undefined ? lineEndY / 1000 : 0;
          requestBody.lineEndZ = lineEndZ !== undefined ? lineEndZ / 1000 : 0;
        }
        
        // Add circle coordinates if defined (convert mm to meters)
        if (circleRadius !== undefined && circleCenterX !== undefined) {
          requestBody.circleRadius = circleRadius / 1000;
          requestBody.circleCenterX = circleCenterX / 1000;
          requestBody.circleCenterY = circleCenterY !== undefined ? circleCenterY / 1000 : 0;
          requestBody.circleCenterZ = circleCenterZ !== undefined ? circleCenterZ / 1000 : 0;
        }
        
        // Add second line if enabled
        if (enableLine2 && line2StartX !== undefined && line2EndX !== undefined) {
          requestBody.line2StartX = line2StartX / 1000;
          requestBody.line2StartY = line2StartY !== undefined ? line2StartY / 1000 : 0;
          requestBody.line2StartZ = line2StartZ !== undefined ? line2StartZ / 1000 : 0;
          requestBody.line2EndX = line2EndX / 1000;
          requestBody.line2EndY = line2EndY !== undefined ? line2EndY / 1000 : 0;
          requestBody.line2EndZ = line2EndZ !== undefined ? line2EndZ / 1000 : 0;
        }
        
        // Add second circle if enabled
        if (enableCircle2 && circle2Radius !== undefined && circle2CenterX !== undefined) {
          requestBody.circle2Radius = circle2Radius / 1000;
          requestBody.circle2CenterX = circle2CenterX / 1000;
          requestBody.circle2CenterY = circle2CenterY !== undefined ? circle2CenterY / 1000 : 0;
          requestBody.circle2CenterZ = circle2CenterZ !== undefined ? circle2CenterZ / 1000 : 0;
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
  }, [magnetType, dimensions, magnetization, magnetizationType, magnetizationAngle, calcX, calcY, calcZ, numFluxLines, maxColorScale, lineStartX, lineStartY, lineStartZ, lineEndX, lineEndY, lineEndZ, circleRadius, circleCenterX, circleCenterY, circleCenterZ, enableLine2, line2StartX, line2StartY, line2StartZ, line2EndX, line2EndY, line2EndZ, enableCircle2, circle2Radius, circle2CenterX, circle2CenterY, circle2CenterZ]);

  const getViewDescription = () => {
    if (((magnetType === 'ring' || magnetType === 'ring_segment' || magnetType === 'cylindrical') && 
         (magnetizationType === 'radial' || magnetizationType === 'diametral')) ||
        (magnetType === 'ring_multi_segment' && magnetizationType === 'axial')) {
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
          <div className="w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0" data-testid="plotly-field-visualization">
            <div className="min-w-[600px] sm:min-w-0">
              <Plot
                data={plotlyData.data}
                layout={{
                  ...plotlyData.layout,
                  autosize: true,
                  margin: { l: 50, r: 50, t: 40, b: 50 },
                  font: { size: 11 }
                }}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                  scrollZoom: true
                }}
                style={{ width: '100%', height: '400px' }}
                useResizeHandler={true}
                className="sm:!h-[600px]"
              />
            </div>
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
