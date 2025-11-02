import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import type { MagnetType } from "@shared/schema";

interface FieldVisualizationProps {
  magnetType: MagnetType;
  calcX: number;
  calcY: number;
  calcZ: number;
  Bx?: number;
  By?: number;
  Bz?: number;
}

export function FieldVisualization({
  magnetType,
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
    const scale = 30;

    ctx.clearRect(0, 0, width, height);

    // White background for better visibility
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Light border
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    drawAxes(ctx, centerX, centerY, width, height);

    drawMagnet(ctx, centerX, centerY, magnetType, scale);

    drawFieldLines(ctx, centerX, centerY, scale);

    const calcScreenX = centerX + calcX * scale;
    const calcScreenY = centerY - calcZ * scale;
    drawCalculationPoint(ctx, calcScreenX, calcScreenY, Bx, By, Bz, scale);
  }, [magnetType, calcX, calcY, calcZ, Bx, By, Bz]);

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
    scale: number
  ) {
    ctx.fillStyle = "#ef444415";
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;

    const size = scale * 2;

    switch (type) {
      case "bar":
      case "rectangular":
        ctx.fillRect(centerX - size / 2, centerY - size / 3, size, (size * 2) / 3);
        ctx.strokeRect(centerX - size / 2, centerY - size / 3, size, (size * 2) / 3);
        break;
      case "cylindrical":
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, size / 2, size / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case "ring":
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, size / 2, size / 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, size / 4, size / 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", centerX, centerY - size / 6);
    ctx.fillText("S", centerX, centerY + size / 6 + 4);
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
              <div className="w-3 h-3 rounded-sm bg-primary/15 border-2 border-primary"></div>
              <span className="text-muted-foreground">Magnet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-muted-foreground">Calc Point</span>
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
