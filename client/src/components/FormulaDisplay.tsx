import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { MagnetType } from "@shared/schema";

interface FormulaDisplayProps {
  magnetType: MagnetType;
}

export function FormulaDisplay({ magnetType }: FormulaDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formulas = {
    cylindrical: {
      title: "Magpylib Magnet-Simulation (Rundmagnet)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet Cylinder-Modell. Unterstützt axiale und diametrale Magnetisierung.",
      equations: [
        "magpy.magnet.Cylinder(polarization, dimension)",
        "polarization = (px, py, pz) [T]",
        "  Axial: (0, 0, M) - Magnetisierung entlang Z-Achse",
        "  Diametral: (M·cos(α), 0, M·sin(α)) - drehbar um Z-Achse",
        "dimension = (diameter, length) [m]",
        "Koordinaten: (x, y, z) mit Ursprung im Magnetzentrum",
        "B(x,y,z) = magpy.getB(magnet, observers)",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
    },
    rectangular: {
      title: "Magpylib Magnet-Simulation (Vierkantmagnet)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet Cuboid-Modell für exakte Nahfeld-Ergebnisse.",
      equations: [
        "magpy.magnet.Cuboid(polarization, dimension)",
        "polarization = (0, 0, M) [T] - Magnetisierung entlang Z-Achse",
        "dimension = (length, width, height) [m]",
        "Koordinaten: (x, y, z) mit Ursprung im Magnetzentrum",
        "  UI: z=0 an Magnetoberfläche (Nord-Pol)",
        "  Intern: z=0 im Zentrum, z=+height/2 oben",
        "B(x,y,z) = magpy.getB(magnet, observers)",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
    },
    ring: {
      title: "Magpylib Magnet-Simulation (Ringmagnet)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet CylinderSegment-Modell. Unterstützt axiale und diametrale Magnetisierung.",
      equations: [
        "magpy.magnet.CylinderSegment(polarization, dimension)",
        "polarization = (px, py, pz) [T]",
        "  Axial: (0, 0, -M) - entlang Z-Achse (invertiert)",
        "  Diametral: (M·cos(α), 0, M·sin(α)) - drehbar",
        "dimension = (r_inner, r_outer, height, φ₁, φ₂)",
        "  r_inner, r_outer: Innen-/Außenradius [m]",
        "  height: Dicke [m]",
        "  φ₁=0°, φ₂=360° für vollständigen Ring",
        "B(x,y,z) = magpy.getB(magnet, observers)",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
      multipoleNote: "Hinweis: Mehrpolige Magnetisierung am Umfang ist mit Magpylib möglich, aber nicht direkt unterstützt. Man kann mehrere Segmente zu einem Halbach-Array zusammensetzen.",
    },
    ring_segment: {
      title: "Magpylib Magnet-Simulation (Ringsegment)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet CylinderSegment-Modell für partiellen Ring. Unterstützt axiale, diametrale und radiale Magnetisierung.",
      equations: [
        "magpy.magnet.CylinderSegment(polarization, dimension)",
        "polarization = (px, py, pz) [T]",
        "  Axial: (0, 0, -M)",
        "  Diametral: (M·cos(α), 0, M·sin(α))",
        "  Radial: (M·cos(φ_center), M·sin(φ_center), 0)",
        "    φ_center = (φ₁+φ₂)/2 - Segment-Mittenwinkel",
        "dimension = (r_inner, r_outer, height, φ₁, φ₂)",
        "  φ₁, φ₂: Start-/Endwinkel [°]",
        "Radial: Diskretisiert in max(4, Δφ/15°) Untersegmente",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
    },
    ring_multi_segment: {
      title: "Magpylib Magnet-Simulation (Multi-Segment-Ring)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet Collection aus mehreren CylinderSegments mit alternierenden N-S-Polen. Ideal für Halbach-Arrays und Motormagnete.",
      equations: [
        "magpy.Collection(*segments)",
        "Segment i: CylinderSegment(polarization_i, dimension_i)",
        "  dimension_i = (r_inner, r_outer, height, φ_i, φ_{i+1})",
        "  φ_i = i · (360°/n_poles)",
        "  n_poles: Anzahl Polpaare (2-24)",
        "polarization_i = (px_i, py_i, 0) [T] - radial",
        "  φ_{center,i} = (φ_i + φ_{i+1})/2",
        "  (px_i, py_i) = M · (cos(φ_c,i), sin(φ_c,i)) · (-1)^i",
        "  Alternierende Richtung: N→S→N→S...",
        "B_total = Σ B_i - Superposition aller Segmente",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
      multipoleNote: "Hinweis: Multi-Segment-Ringe eignen sich perfekt für Halbach-Arrays, bürstenlose Motoren und andere Anwendungen mit mehrpoliger Magnetisierung.",
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

          {("multipoleNote" in formula) && (
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-100">
              {formula.multipoleNote}
            </div>
          )}

          <a
            href={formula.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Magpylib Dokumentation
          </a>

          <div className="text-xs text-muted-foreground pt-2">
            Hinweis: Berechnungen mit Magpylib v5.2 - numerisch exakte Ergebnisse. 
            Abweichungen in der Praxis durch Materialqualität, Temperatur und Fertigungstoleranzen möglich.
          </div>
        </div>
      )}
    </Card>
  );
}
