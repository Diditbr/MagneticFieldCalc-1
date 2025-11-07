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
        "Magnet-Typ: magpy.magnet.Cylinder",
        "Axial: Magnetisierung entlang Z-Achse (Nord oben)",
        "Diametral: Magnetisierung in X-Z-Ebene (Winkel einstellbar)",
        "Berechnung: Numerisch exakt, auch im Nahfeld",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
    },
    rectangular: {
      title: "Magpylib Magnet-Simulation (Vierkantmagnet)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet Cuboid-Modell für exakte Nahfeld-Ergebnisse.",
      equations: [
        "Magnet-Typ: magpy.magnet.Cuboid",
        "Magnetisierung: M entlang Z-Achse (Nord oben)",
        "Berechnung: Numerisch exakt, auch im Nahfeld",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
    },
    ring: {
      title: "Magpylib Magnet-Simulation (Ringmagnet)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet CylinderSegment-Modell. Unterstützt axiale und diametrale Magnetisierung.",
      equations: [
        "Magnet-Typ: magpy.magnet.CylinderSegment (360°)",
        "Axial: Magnetisierung entlang Z-Achse",
        "Diametral: Magnetisierung in X-Z-Ebene (Winkel einstellbar)",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
      multipoleNote: "Hinweis: Mehrpolige Magnetisierung am Umfang ist mit Magpylib möglich, aber nicht direkt unterstützt. Man kann mehrere Segmente zu einem Halbach-Array zusammensetzen.",
    },
    ring_segment: {
      title: "Magpylib Magnet-Simulation (Ringsegment)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet CylinderSegment-Modell für partiellen Ring. Unterstützt axiale, diametrale und radiale Magnetisierung.",
      equations: [
        "Magnet-Typ: magpy.magnet.CylinderSegment (φ₁ bis φ₂)",
        "Axial: Magnetisierung entlang Z-Achse",
        "Diametral: Magnetisierung in X-Z-Ebene",
        "Radial: Magnetisierung radial nach außen (diskretisiert)",
      ],
      docsUrl: "https://magpylib.readthedocs.io/en/stable/",
    },
    ring_multi_segment: {
      title: "Magpylib Magnet-Simulation (Multi-Segment-Ring)",
      description:
        "Präzise Berechnung mit Magpylib. Verwendet Collection aus mehreren CylinderSegments mit alternierenden N-S-Polen. Ideal für Halbach-Arrays und Motormagnete.",
      equations: [
        "Magnet-Typ: magpy.Collection aus CylinderSegments",
        "Polarisierung: Automatisch alternierend Nord-Süd",
        "Segmentanzahl: Einstellbar (2-24 Pole)",
        "Radial: Jedes Segment diskretisiert für glatte Feldverteilung",
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
