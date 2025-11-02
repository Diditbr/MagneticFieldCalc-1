import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import type { MagnetType, FieldGridResponse } from "@shared/schema";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fieldGrid, setFieldGrid] = useState<FieldGridResponse | null>(null);
  const [magnetization, setMagnetization] = useState(1.32); // Default NdFeB N42
  
  // Fetch field grid from backend when magnet configuration changes
  useEffect(() => {
    const fetchFieldGrid = async () => {
      // Determine grid bounds based on magnet dimensions
      // Use MUCH larger area to ensure all flux lines can complete their loops
      let maxDim = 10;
      if (magnetType === "bar" || magnetType === "rectangular") {
        maxDim = Math.max(dimensions.length || 10, dimensions.height || 2) * 6;
      } else if (magnetType === "cylindrical") {
        maxDim = Math.max(dimensions.diameter || 10, dimensions.length || 10) * 6;
      } else if (magnetType === "ring") {
        maxDim = Math.max(dimensions.diameter || 10, dimensions.thickness || 5) * 6;
      }
      
      try {
        const response = await fetch('/api/field-grid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: magnetType,
            magnetization,
            ...dimensions,
            xMin: -maxDim / 2,
            xMax: maxDim / 2,
            zMin: -maxDim / 2,
            zMax: maxDim / 2,
            gridSize: 50, // Increased for better accuracy with larger area
          }),
        });
        
        if (response.ok) {
          const data: FieldGridResponse = await response.json();
          setFieldGrid(data);
        }
      } catch (error) {
        console.error('Failed to fetch field grid:', error);
      }
    };
    
    fetchFieldGrid();
  }, [magnetType, dimensions, magnetization]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!fieldGrid) return; // Wait for field grid to be available

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate scale based on actual magnet dimensions and calculation point
    let maxDimension = 10; // default
    
    if (magnetType === "bar" || magnetType === "rectangular") {
      maxDimension = Math.max(
        dimensions.length || 10,
        dimensions.width || 5,
        dimensions.height || 2,
        Math.abs(calcX),
        Math.abs(calcZ)
      );
    } else if (magnetType === "cylindrical") {
      maxDimension = Math.max(
        dimensions.diameter || 10,
        dimensions.length || 10,
        Math.abs(calcX),
        Math.abs(calcZ)
      );
    } else if (magnetType === "ring") {
      maxDimension = Math.max(
        dimensions.diameter || 10,
        dimensions.thickness || 5,
        Math.abs(calcX),
        Math.abs(calcZ)
      );
    }
    
    // Add some padding and ensure calculation point is visible
    maxDimension = Math.max(maxDimension * 2.5, Math.abs(calcX) * 1.2, Math.abs(calcZ) * 1.2);
    
    // Scale to fit in canvas with margin - more room for flux loops
    const scale = Math.min(width, height) / (maxDimension * 2.8);

    ctx.clearRect(0, 0, width, height);

    // White background for better visibility
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Light border
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    drawAxes(ctx, centerX, centerY, width, height);

    drawMagnet(ctx, centerX, centerY, magnetType, dimensions, scale);

    drawFieldLines(ctx, centerX, centerY, scale, magnetType, dimensions, numFluxLines, fieldGrid);
    
    drawMagnetizationArrow(ctx, centerX, centerY, dimensions, magnetType, scale);

    const calcScreenX = centerX + calcX * scale;
    const calcScreenY = centerY - calcZ * scale;
    drawCalculationPoint(ctx, calcScreenX, calcScreenY, Bx, By, Bz, scale);
  }, [magnetType, dimensions, calcX, calcY, calcZ, Bx, By, Bz, numFluxLines, fieldGrid]);

  function drawAxes(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ) {
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("X", width - 20, centerY - 8);
    ctx.fillText("Z", centerX + 8, 20);
  }

  function drawMagnet(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    type: MagnetType,
    dimensions: {
      length?: number;
      width?: number;
      height?: number;
      diameter?: number;
      innerDiameter?: number;
      thickness?: number;
    },
    scale: number
  ) {
    ctx.fillStyle = "#ef444425"; // More transparent to see flux lines inside
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;

    switch (type) {
      case "bar":
      case "rectangular": {
        const width = (dimensions.length || 10) * scale;
        const height = (dimensions.height || 2) * scale;
        ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height);
        ctx.strokeRect(centerX - width / 2, centerY - height / 2, width, height);
        
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("N", centerX, centerY - height / 4);
        ctx.fillText("S", centerX, centerY + height / 4 + 4);
        break;
      }
      case "cylindrical": {
        // For X-Z plane view, cylinder appears as a rectangle (side view)
        const width = (dimensions.diameter || 10) * scale;
        const height = (dimensions.length || 10) * scale;
        ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height);
        ctx.strokeRect(centerX - width / 2, centerY - height / 2, width, height);
        
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("N", centerX, centerY - height / 4);
        ctx.fillText("S", centerX, centerY + height / 4 + 4);
        break;
      }
      case "ring": {
        // For X-Z plane view, ring appears as two rectangles (side view)
        const outerWidth = (dimensions.diameter || 10) * scale;
        const innerWidth = (dimensions.innerDiameter || 5) * scale;
        const height = (dimensions.thickness || 5) * scale;
        
        // Draw outer rectangle
        ctx.fillRect(centerX - outerWidth / 2, centerY - height / 2, outerWidth, height);
        ctx.strokeRect(centerX - outerWidth / 2, centerY - height / 2, outerWidth, height);
        
        // Draw inner hollow area (clear it)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(centerX - innerWidth / 2, centerY - height / 2, innerWidth, height);
        ctx.strokeStyle = "#ef4444";
        ctx.strokeRect(centerX - innerWidth / 2, centerY - height / 2, innerWidth, height);
        
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("N", centerX - (outerWidth + innerWidth) / 4, centerY - height / 4);
        ctx.fillText("S", centerX - (outerWidth + innerWidth) / 4, centerY + height / 4 + 4);
        break;
      }
    }
  }

  function drawFieldLines(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    scale: number,
    magnetType: MagnetType,
    dimensions: {
      length?: number;
      width?: number;
      height?: number;
      diameter?: number;
      innerDiameter?: number;
      thickness?: number;
    },
    numFluxLines: number,
    fieldGrid: FieldGridResponse
  ) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;

    // Get magnet dimensions in world coordinates
    let magnetHeight = 0;
    let magnetWidth = 0;
    
    if (magnetType === "bar" || magnetType === "rectangular") {
      magnetHeight = dimensions.height || 2;
      magnetWidth = dimensions.length || 10;
    } else if (magnetType === "cylindrical") {
      magnetHeight = dimensions.length || 10;
      magnetWidth = dimensions.diameter || 10;
    } else if (magnetType === "ring") {
      magnetHeight = dimensions.thickness || 5;
      magnetWidth = dimensions.diameter || 10;
    }

    // Adaptive step size based on magnet dimensions
    const characteristicLength = Math.max(magnetHeight, magnetWidth);
    const baseStepSize = characteristicLength * 0.02;

    // Bilinear interpolation over field grid
    function getBField(x: number, z: number): { Bx: number; Bz: number } {
      const { xValues, zValues, Bx: BxGrid, Bz: BzGrid } = fieldGrid;
      
      // Find grid cell containing (x, z)
      const xMin = xValues[0];
      const xMax = xValues[xValues.length - 1];
      const zMin = zValues[0];
      const zMax = zValues[zValues.length - 1];
      
      // Clamp to grid bounds (use edge values if out of bounds)
      // This allows flux lines to continue even near grid edges
      const xClamped = Math.max(xMin, Math.min(xMax, x));
      const zClamped = Math.max(zMin, Math.min(zMax, z));
      
      x = xClamped;
      z = zClamped;
      
      // Find surrounding grid indices
      let i1 = 0, i2 = 0, j1 = 0, j2 = 0;
      for (let i = 0; i < zValues.length - 1; i++) {
        if (z >= zValues[i] && z <= zValues[i + 1]) {
          i1 = i;
          i2 = i + 1;
          break;
        }
      }
      for (let j = 0; j < xValues.length - 1; j++) {
        if (x >= xValues[j] && x <= xValues[j + 1]) {
          j1 = j;
          j2 = j + 1;
          break;
        }
      }
      
      // Bilinear interpolation weights
      const tx = (x - xValues[j1]) / (xValues[j2] - xValues[j1]);
      const tz = (z - zValues[i1]) / (zValues[i2] - zValues[i1]);
      
      // Interpolate Bx
      const Bx11 = BxGrid[i1][j1];
      const Bx12 = BxGrid[i1][j2];
      const Bx21 = BxGrid[i2][j1];
      const Bx22 = BxGrid[i2][j2];
      const Bx = (1 - tx) * (1 - tz) * Bx11 + tx * (1 - tz) * Bx12 + (1 - tx) * tz * Bx21 + tx * tz * Bx22;
      
      // Interpolate Bz
      const Bz11 = BzGrid[i1][j1];
      const Bz12 = BzGrid[i1][j2];
      const Bz21 = BzGrid[i2][j1];
      const Bz22 = BzGrid[i2][j2];
      const Bz = (1 - tx) * (1 - tz) * Bz11 + tx * (1 - tz) * Bz12 + (1 - tx) * tz * Bz21 + tx * tz * Bz22;
      
      return { Bx, Bz };
    }

    // Function to trace a field line using adaptive integration to form closed loops
    function traceFieldLine(startX: number, startZ: number): { x: number; z: number; inside: boolean }[] {
      const points: { x: number; z: number; inside: boolean }[] = [];
      let x = startX;
      let z = startZ;
      const maxSteps = 8000; // More steps to complete loops
      const maxDistance = characteristicLength * 50; // Much larger area for complete loops
      
      // Track loop completion
      let wasOutside = false;
      let hasReenteredFromBelow = false;
      let consecutiveInsideSteps = 0;

      for (let step = 0; step < maxSteps; step++) {
        // Check if point is inside the magnet
        const insideMagnetZ = Math.abs(z) < magnetHeight / 2;
        const insideMagnetX = Math.abs(x) < magnetWidth / 2;
        
        // For ring magnets, exclude the hollow center
        let isInside = insideMagnetZ && insideMagnetX;
        if (magnetType === "ring" && dimensions.innerDiameter) {
          const innerWidth = dimensions.innerDiameter;
          const insideHollowX = Math.abs(x) < innerWidth / 2;
          const insideHollowZ = Math.abs(z) < magnetHeight / 2;
          const isInHollow = insideHollowX && insideHollowZ;
          isInside = isInside && !isInHollow; // Inside outer but NOT inside hollow
        }
        
        points.push({ x, z, inside: isInside });

        // Check if we've gone too far
        const distFromOrigin = Math.sqrt(x * x + z * z);
        if (distFromOrigin > maxDistance) break;

        // Get field direction at current point
        const field = getBField(x, z);
        let magnitude = Math.sqrt(field.Bx * field.Bx + field.Bz * field.Bz);
        
        if (magnitude < 0.00001) break; // Stop if field is too weak

        // Inside the magnet, force field to be vertical (uniform field assumption)
        // This prevents numerical artifacts from causing lines to converge
        let dx, dz;
        if (isInside) {
          // Inside: go straight up (from S to N), ignore horizontal components
          dx = 0;
          dz = 1;
        } else {
          // Outside: follow the actual field direction
          dx = field.Bx / magnitude;
          dz = field.Bz / magnitude;
        }

        // Adaptive step size: smaller steps near boundaries and inside magnet
        const distanceFromOrigin = Math.sqrt(x * x + z * z);
        let adaptiveDt = baseStepSize * Math.min(3, 0.5 + distanceFromOrigin / characteristicLength);
        
        // Use much smaller steps inside the magnet for better visualization
        if (isInside) {
          adaptiveDt *= 0.25;
        }

        // Euler integration
        x += dx * adaptiveDt;
        z += dz * adaptiveDt;

        // Track loop completion: field line exits from top (north), curves around, 
        // enters from bottom (south), and travels back up inside to complete the loop
        if (!isInside) {
          wasOutside = true;
          consecutiveInsideSteps = 0;
        }
        
        // After being outside, check if we re-entered from below (south pole)
        if (wasOutside && isInside && z < 0) {
          hasReenteredFromBelow = true;
        }
        
        // Count consecutive steps inside after re-entry
        if (hasReenteredFromBelow && isInside) {
          consecutiveInsideSteps++;
        }
        
        // Loop is complete when we've traveled through the magnet back near the start
        // Check if we're near the top (north) side after completing the external loop
        if (hasReenteredFromBelow && isInside && z > magnetHeight * 0.25 && consecutiveInsideSteps > 15) {
          // Close to starting height - loop complete
          break;
        }
        
        // Safety: also stop if we've gone outside the grid bounds
        if (field.Bx === 0 && field.Bz === 0 && !isInside) {
          break;
        }
      }

      return points;
    }

    // Helper function to draw a field line path (only outside the magnet)
    const drawFieldLinePath = (
      points: { x: number; z: number; inside: boolean }[]
    ) => {
      let currentPath: { x: number; z: number }[] = [];
      let wasInside = points[0]?.inside || false;
      
      for (let j = 0; j < points.length; j++) {
        const point = points[j];
        
        // If transition between inside/outside, finish current path and start new one
        if (point.inside !== wasInside && currentPath.length > 0) {
          // Only draw if the segment was OUTSIDE the magnet
          if (!wasInside) {
            ctx.strokeStyle = "#3b82f6"; // Blue for outside
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            for (let k = 0; k < currentPath.length; k++) {
              const screenX = centerX + currentPath[k].x * scale;
              const screenY = centerY - currentPath[k].z * scale;
              if (k === 0) {
                ctx.moveTo(screenX, screenY);
              } else {
                ctx.lineTo(screenX, screenY);
              }
            }
            // Add the current point to reach the boundary
            const screenX = centerX + point.x * scale;
            const screenY = centerY - point.z * scale;
            ctx.lineTo(screenX, screenY);
            ctx.stroke();
          }
          
          // Start new path
          currentPath = [point];
          wasInside = point.inside;
        } else {
          currentPath.push(point);
        }
      }
      
      // Draw the final path segment (only if outside)
      if (currentPath.length > 0 && !wasInside) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        for (let k = 0; k < currentPath.length; k++) {
          const screenX = centerX + currentPath[k].x * scale;
          const screenY = centerY - currentPath[k].z * scale;
          if (k === 0) {
            ctx.moveTo(screenX, screenY);
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }
        ctx.stroke();
      }
    };
    
    // Start flux lines from the north pole (top of magnet)
    // Distribute starting points evenly across the entire magnet width (edge to edge)
    const poleZ = magnetHeight / 2;
    const poleWidth = magnetWidth / 2;
    
    // Calculate even spacing across the full magnet width
    const totalLines = numFluxLines;
    const spacing = magnetWidth / (totalLines + 1); // Add 1 to avoid edges
    
    for (let i = 0; i < totalLines; i++) {
      // Start from left side and space evenly across the magnet
      // For 10mm magnet with 8 lines: spacing = 10/9 = 1.11mm
      // Positions: -5 + 1.11, -5 + 2.22, ..., -5 + 8.88
      const startX = -poleWidth + spacing * (i + 1);
      
      // Start just outside the north pole to trace complete closed loop
      const startZ = poleZ + characteristicLength * 0.03;
      
      // Trace complete closed field line loop
      const points = traceFieldLine(startX, startZ);
      
      // Draw the field line
      drawFieldLinePath(points);
    }
    
    // Reset stroke style
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
  }

  function drawMagnetizationArrow(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    dimensions: {
      length?: number;
      width?: number;
      height?: number;
      diameter?: number;
      innerDiameter?: number;
      thickness?: number;
    },
    type: MagnetType,
    scale: number
  ) {
    // Draw magnetization direction arrow (S to N, pointing up along Z-axis)
    ctx.strokeStyle = "#9333ea";
    ctx.fillStyle = "#9333ea";
    ctx.lineWidth = 2.5;
    
    let magnetHeight = 2;
    if (type === "bar" || type === "rectangular") {
      magnetHeight = dimensions.height || 2;
    } else if (type === "cylindrical") {
      magnetHeight = dimensions.length || 10;
    } else if (type === "ring") {
      magnetHeight = dimensions.thickness || 5;
    }
    
    const arrowStart = centerY + (magnetHeight * scale * 0.6);
    const arrowEnd = centerY - (magnetHeight * scale * 0.6);
    const arrowX = centerX + (Math.max(dimensions.length || 10, dimensions.diameter || 10) * scale * 0.6);
    
    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowStart);
    ctx.lineTo(arrowX, arrowEnd);
    ctx.stroke();
    
    // Draw arrowhead
    const headLength = 12;
    const headWidth = 8;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowEnd);
    ctx.lineTo(arrowX - headWidth / 2, arrowEnd + headLength);
    ctx.lineTo(arrowX + headWidth / 2, arrowEnd + headLength);
    ctx.closePath();
    ctx.fill();
    
    // Add label
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("M", arrowX + 10, (arrowStart + arrowEnd) / 2 + 4);
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("(magnetization)", arrowX + 10, (arrowStart + arrowEnd) / 2 + 18);
  }

  function drawCalculationPoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    Bx: number,
    By: number,
    Bz: number,
    scale: number
  ) {
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    const magnitude = Math.sqrt(Bx * Bx + By * By + Bz * Bz);
    if (magnitude > 0) {
      const arrowLength = Math.min(magnitude * 20, scale * 1.5);
      const angle = Math.atan2(-Bz, Bx);

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + arrowLength * Math.cos(angle), y + arrowLength * Math.sin(angle));
      ctx.stroke();

      const headLength = 8;
      const headAngle = Math.PI / 6;
      const endX = x + arrowLength * Math.cos(angle);
      const endY = y + arrowLength * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - headAngle),
        endY - headLength * Math.sin(angle - headAngle)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + headAngle),
        endY - headLength * Math.sin(angle + headAngle)
      );
      ctx.stroke();
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Field Visualization</h3>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-500/15 border-2 border-red-500"></div>
              <span className="text-muted-foreground">Magnet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-muted-foreground">Calc Point</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
              <span className="text-muted-foreground">Magnetization</span>
            </div>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full rounded-md bg-card"
          data-testid="canvas-field-visualization"
        />
        <div className="text-xs text-muted-foreground text-center">
          2D cross-section showing field lines and calculation point (X-Z plane)
        </div>
      </div>
    </Card>
  );
}
