import { useEffect, useRef } from "react";
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
}: FieldVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    maxDimension = Math.max(maxDimension * 1.5, Math.abs(calcX) * 1.2, Math.abs(calcZ) * 1.2);
    
    // Scale to fit in canvas with margin
    const scale = Math.min(width, height) / (maxDimension * 2.5);

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

    drawFieldLines(ctx, centerX, centerY, scale);
    
    drawMagnetizationArrow(ctx, centerX, centerY, dimensions, magnetType, scale);

    const calcScreenX = centerX + calcX * scale;
    const calcScreenY = centerY - calcZ * scale;
    drawCalculationPoint(ctx, calcScreenX, calcScreenY, Bx, By, Bz, scale);
  }, [magnetType, dimensions, calcX, calcY, calcZ, Bx, By, Bz]);

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
    ctx.fillStyle = "#ef444415";
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
    scale: number
  ) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;

    const fieldLineConstants = [0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7];
    
    for (const r0 of fieldLineConstants) {
      ctx.beginPath();
      
      const startTheta = Math.PI * 0.05;
      const endTheta = Math.PI * 0.95;
      const steps = 100;
      
      for (let i = 0; i <= steps; i++) {
        const theta = startTheta + (endTheta - startTheta) * (i / steps);
        const sinTheta = Math.sin(theta);
        const r = r0 * scale * sinTheta * sinTheta;
        
        const x = centerX + r * Math.sin(theta);
        const z = centerY - r * Math.cos(theta);
        
        if (i === 0) {
          ctx.moveTo(x, z);
        } else {
          ctx.lineTo(x, z);
        }
      }
      ctx.stroke();
      
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const theta = startTheta + (endTheta - startTheta) * (i / steps);
        const sinTheta = Math.sin(theta);
        const r = r0 * scale * sinTheta * sinTheta;
        
        const x = centerX - r * Math.sin(theta);
        const z = centerY - r * Math.cos(theta);
        
        if (i === 0) {
          ctx.moveTo(x, z);
        } else {
          ctx.lineTo(x, z);
        }
      }
      ctx.stroke();
    }
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
