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

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim();
    ctx.fillRect(0, 0, width, height);

    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--border")
      .trim();
    
    ctx.strokeStyle = `hsl(${borderColor})`;
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
    const foregroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--muted-foreground")
      .trim();
    
    ctx.strokeStyle = `hsl(${foregroundColor} / 0.2)`;
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

    ctx.fillStyle = `hsl(${foregroundColor} / 0.6)`;
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
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim();
    
    ctx.fillStyle = `hsl(${primaryColor} / 0.15)`;
    ctx.strokeStyle = `hsl(${primaryColor})`;
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

    ctx.fillStyle = `hsl(${primaryColor})`;
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
    const chart1Color = getComputedStyle(document.documentElement)
      .getPropertyValue("--chart-1")
      .trim();
    
    ctx.strokeStyle = `hsl(${chart1Color} / 0.4)`;
    ctx.lineWidth = 1.5;

    const northPoleY = centerY - scale * 0.5;
    const southPoleY = centerY + scale * 0.5;

    for (let i = 0; i < 6; i++) {
      const offsetX = (i - 2.5) * scale * 0.3;
      
      ctx.beginPath();
      
      for (let t = 0; t <= 1; t += 0.02) {
        const angle = t * Math.PI;
        
        const radiusX = Math.abs(offsetX) + scale * 1.5 * Math.sin(angle);
        const radiusY = scale * 2 * Math.sin(angle);
        
        const x = centerX + offsetX * (1 - Math.sin(angle)) + radiusX * Math.sign(offsetX || 1);
        const y = northPoleY + (southPoleY - northPoleY) * t + radiusY * 0.5;
        
        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
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
    const destructiveColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--destructive")
      .trim();
    
    ctx.fillStyle = `hsl(${destructiveColor})`;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    const magnitude = Math.sqrt(Bx * Bx + By * By + Bz * Bz);
    if (magnitude > 0) {
      const arrowLength = Math.min(magnitude * 20, scale * 1.5);
      const angle = Math.atan2(-Bz, Bx);

      ctx.strokeStyle = `hsl(${destructiveColor})`;
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
