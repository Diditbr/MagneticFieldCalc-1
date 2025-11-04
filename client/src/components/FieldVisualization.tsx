import { useEffect, useState, useRef } from "react";
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
  const [visualizationImage, setVisualizationImage] = useState<string | null>(null);
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
        const dimensionsInMeters: any = {};
        Object.entries(dimensions).forEach(([key, value]) => {
          if (value !== undefined) {
            dimensionsInMeters[key] = value / 1000; // mm to m
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
    }, 500); // Wait 500ms before making request
    
    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [magnetType, dimensions, magnetization, magnetizationType, magnetizationAngle, calcX, calcZ, numFluxLines, maxColorScale, lineStartX, lineStartY, lineStartZ, lineEndX, lineEndY, lineEndZ]);

  return (
    <Card className="p-4 space-y-3" data-testid="card-field-visualization">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Feldvisualisierung</h3>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 border-2 border-[#ef4444] bg-[#ef444420]"></div>
              <span className="text-muted-foreground">Magnet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Berechnungspunkt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span className="text-muted-foreground">Messlinie</span>
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
          2D-Querschnitt mit Feldlinien (X-Z Ebene, Seitenansicht)
        </div>
      </div>
    </Card>
  );
}
