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
      title: "Magpylib Magnet-Simulation (Quader)",
      description:
        "Präzise Berechnung mit Magpylib (Python-Bibliothek). Verwendet Cuboid-Modell für exakte Nahfeld-Ergebnisse.",
      equations: [
        "Magnet-Typ: magpy.magnet.Cuboid",
        "Magnetisierung: M entlang Z-Achse (Nord oben)",
        "Berechnung: Numerisch exakt, auch im Nahfeld",
      ],
    },
    cylindrical: {
      title: "Magpylib Magnet-Simulation (Zylinder)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet Cylinder-Modell. Unterstützt axiale und diametrale Magnetisierung.",
      equations: [
        "Magnet-Typ: magpy.magnet.Cylinder",
        "Axial: Magnetisierung entlang Z-Achse (Nord oben)",
        "Diametral: Magnetisierung in X-Y-Ebene (Winkel einstellbar)",
        "Berechnung: Numerisch exakt, auch im Nahfeld",
      ],
    },
    rectangular: {
      title: "Magpylib Magnet-Simulation (Rechteck)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet Cuboid-Modell für exakte Nahfeld-Ergebnisse.",
      equations: [
        "Magnet-Typ: magpy.magnet.Cuboid",
        "Magnetisierung: M entlang Z-Achse (Nord oben)",
        "Berechnung: Numerisch exakt, auch im Nahfeld",
      ],
    },
    ring: {
      title: "Magpylib Magnet-Simulation (Ring)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet CylinderSegment-Modell. Unterstützt axiale und diametrale Magnetisierung.",
      equations: [
        "Magnet-Typ: magpy.magnet.CylinderSegment (360°)",
        "Axial: Magnetisierung entlang Z-Achse",
        "Diametral: Magnetisierung in X-Y-Ebene (Winkel einstellbar)",
        "⚠️ HINWEIS: Feldlinien-Richtung kann abweichen (in Entwicklung)",
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
          <h3 className="text-sm font-semibold">Berechnungsmethode</h3>
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
            Hinweis: Berechnungen mit Magpylib v5.2 - numerisch exakte Ergebnisse. 
            Abweichungen in der Praxis durch Materialqualität, Temperatur und Fertigungstoleranzen möglich.
          </div>
        </div>
      )}
    </Card>
  );
}
