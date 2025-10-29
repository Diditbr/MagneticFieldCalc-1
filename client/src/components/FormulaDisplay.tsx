import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MagnetType } from "@shared/schema";

interface FormulaDisplayProps {
  magnetType: MagnetType;
}

export function FormulaDisplay({ magnetType }: FormulaDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formulas = {
    bar: {
      title: "Bar Magnet Dipole Approximation",
      description:
        "For distances large compared to magnet size, the field can be approximated using the magnetic dipole model.",
      equations: [
        "B(r) = (μ₀/4π) × (3(m·r̂)r̂ - m) / r³",
        "m = M × V (magnetic moment = magnetization × volume)",
        "μ₀ = 4π × 10⁻⁷ T·m/A (permeability of free space)",
      ],
    },
    cylindrical: {
      title: "Cylindrical Magnet Field",
      description:
        "The field from a cylindrical magnet can be calculated using integration over the magnetized volume or using the dipole approximation for far-field.",
      equations: [
        "For axial field: Bz = (M/2) × [(z+L/2)/√((z+L/2)² + R²) - (z-L/2)/√((z-L/2)² + R²)]",
        "M = magnetization (T), L = length, R = radius",
        "For radial: dipole approximation is typically used",
      ],
    },
    rectangular: {
      title: "Rectangular Magnet Field",
      description:
        "Rectangular magnets can be modeled using surface charge methods or dipole approximation for distant points.",
      equations: [
        "B(r) = (μ₀/4π) × (3(m·r̂)r̂ - m) / r³ (dipole approximation)",
        "m = M × L × W × H (magnetic moment)",
        "Exact solutions require numerical integration",
      ],
    },
    ring: {
      title: "Ring Magnet Field",
      description:
        "Ring magnets (annular magnets) have fields that can be calculated using integration methods or approximated as a dipole.",
      equations: [
        "For axial field: Superposition of two cylinders (outer - inner)",
        "B(r) ≈ dipole approximation for far-field",
        "m = M × π × (R₁² - R₂²) × t",
      ],
    },
  };

  const formula = formulas[magnetType];

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover-elevate active-elevate-2"
        data-testid="button-toggle-formula"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold">Formula & Physics</h3>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t">
          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-1">{formula.title}</h4>
            <p className="text-sm text-muted-foreground">{formula.description}</p>
          </div>

          <div className="space-y-2">
            {formula.equations.map((eq, i) => (
              <div
                key={i}
                className="p-3 rounded-md bg-muted/50 font-mono text-xs overflow-x-auto"
              >
                {eq}
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground pt-2">
            Note: These calculations use simplified models. Real-world measurements may vary based on
            magnet quality, temperature, and manufacturing tolerances.
          </div>
        </div>
      )}
    </Card>
  );
}
