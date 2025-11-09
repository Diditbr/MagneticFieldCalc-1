import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { BookOpen, FileCode, Calculator } from "lucide-react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

type MagnetType = 'rectangular' | 'cylindrical' | 'ring' | 'ring_segment' | 'ring_multi_segment';

interface DocumentationData {
  flowchart: string;
  formulas: {
    polarization_axial?: string;
    polarization_diametral?: string;
    polarization_radial?: string;
    coordinate_transform?: string;
    field_calculation?: string;
    cylindrical_decomposition?: string;
    multi_segment?: string;
  };
  magnet_type: string;
}

const magnetTypeNames: Record<MagnetType, string> = {
  rectangular: "Vierkantmagnet",
  cylindrical: "Rundmagnet",
  ring: "Ringmagnet",
  ring_segment: "Ringsegment",
  ring_multi_segment: "Multi-Segment-Ring",
};

function LaTeXFormula({ latex }: { latex: string }) {
  // Check if it's a display math (contains \\begin or multiple lines)
  const isDisplayMath = latex.includes('\\begin') || latex.includes('\\\\');
  
  // Remove leading/trailing $ symbols if present
  const cleanLatex = latex.replace(/^\$+|\$+$/g, '');
  
  if (isDisplayMath) {
    return (
      <div className="my-4 overflow-x-auto">
        <BlockMath math={cleanLatex} />
      </div>
    );
  }
  
  return (
    <div className="my-2">
      <InlineMath math={cleanLatex} />
    </div>
  );
}

function DocumentationSection({ magnetType }: { magnetType: MagnetType }) {
  const { data, isLoading, error } = useQuery<DocumentationData>({
    queryKey: [`/api/documentation/${magnetType}`],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" data-testid="alert-documentation-error">
        <AlertDescription>
          Fehler beim Laden der Dokumentation: {error instanceof Error ? error.message : 'Unbekannter Fehler'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Flowchart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            <CardTitle>Programmablauf</CardTitle>
          </div>
          <CardDescription>
            Flussdiagramm der Berechnungsschritte für {magnetTypeNames[magnetType]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-md font-mono text-xs overflow-x-auto whitespace-pre">
            {data.flowchart}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Hinweis: Dies ist die flowchart.js DSL-Notation. Sie kann online visualisiert werden unter{" "}
            <a
              href="https://flowchart.js.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-flowchart-visualizer"
            >
              flowchart.js.org
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Formulas Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Verwendete Formeln</CardTitle>
          </div>
          <CardDescription>
            Mathematische Grundlagen und Berechnungsmethoden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Polarization Formulas */}
          {data.formulas.polarization_axial && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Axiale Magnetisierung</h4>
              <LaTeXFormula latex={data.formulas.polarization_axial} />
            </div>
          )}

          {data.formulas.polarization_diametral && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Diametrale Magnetisierung</h4>
              <LaTeXFormula latex={data.formulas.polarization_diametral} />
            </div>
          )}

          {data.formulas.polarization_radial && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Radiale Magnetisierung</h4>
              <LaTeXFormula latex={data.formulas.polarization_radial} />
            </div>
          )}

          {/* Coordinate Transform */}
          {data.formulas.coordinate_transform && (
            <div className="border-t pt-4">
              <LaTeXFormula latex={data.formulas.coordinate_transform} />
            </div>
          )}

          {/* Field Calculation */}
          {data.formulas.field_calculation && (
            <div className="border-t pt-4">
              <LaTeXFormula latex={data.formulas.field_calculation} />
            </div>
          )}

          {/* Cylindrical Decomposition */}
          {data.formulas.cylindrical_decomposition && (
            <div className="border-t pt-4">
              <LaTeXFormula latex={data.formulas.cylindrical_decomposition} />
            </div>
          )}

          {/* Multi-Segment Formula (only for ring_multi_segment) */}
          {data.formulas.multi_segment && (
            <div className="border-t pt-4">
              <LaTeXFormula latex={data.formulas.multi_segment} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Documentation() {
  const [selectedMagnet, setSelectedMagnet] = useState<MagnetType>('rectangular');

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="container mx-auto p-6 max-w-6xl flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Technische Dokumentation
            </h1>
          </div>
          <p className="text-muted-foreground">
            Programmabläufe und mathematische Formeln der Magnetfeldberechnungen
          </p>
        </div>

        <Tabs value={selectedMagnet} onValueChange={(v) => setSelectedMagnet(v as MagnetType)}>
          <TabsList className="grid w-full grid-cols-5 mb-6" data-testid="tabs-magnet-types">
            <TabsTrigger value="rectangular" data-testid="tab-rectangular">
              Vierkant
            </TabsTrigger>
            <TabsTrigger value="cylindrical" data-testid="tab-cylindrical">
              Rundmagnet
            </TabsTrigger>
            <TabsTrigger value="ring" data-testid="tab-ring">
              Ring
            </TabsTrigger>
            <TabsTrigger value="ring_segment" data-testid="tab-ring-segment">
              Segment
            </TabsTrigger>
            <TabsTrigger value="ring_multi_segment" data-testid="tab-multi-segment">
              Multi-Segment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rectangular" data-testid="content-rectangular">
            <DocumentationSection magnetType="rectangular" />
          </TabsContent>

          <TabsContent value="cylindrical" data-testid="content-cylindrical">
            <DocumentationSection magnetType="cylindrical" />
          </TabsContent>

          <TabsContent value="ring" data-testid="content-ring">
            <DocumentationSection magnetType="ring" />
          </TabsContent>

          <TabsContent value="ring_segment" data-testid="content-ring-segment">
            <DocumentationSection magnetType="ring_segment" />
          </TabsContent>

          <TabsContent value="ring_multi_segment" data-testid="content-multi-segment">
            <DocumentationSection magnetType="ring_multi_segment" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
