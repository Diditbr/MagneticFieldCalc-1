import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calculator as CalcIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { MagnetTypeSelector } from "@/components/MagnetTypeSelector";
import { MaterialSelector } from "@/components/MaterialSelector";
import { DimensionInputs } from "@/components/DimensionInputs";
import { CalculationPointInputs } from "@/components/CalculationPointInputs";
import { UnitControls } from "@/components/UnitControls";
import { MagnetizationControls } from "@/components/MagnetizationControls";
import { FieldResults } from "@/components/FieldResults";
import { FieldVisualization } from "@/components/FieldVisualization";
import { FormulaDisplay } from "@/components/FormulaDisplay";
import { LineInputs } from "@/components/LineInputs";
import { LineFieldChart } from "@/components/LineFieldChart";
import { CircleFieldChart } from "@/components/CircleFieldChart";
import { ReportDialog } from "@/components/ReportDialog";
import { convertLength, convertField } from "@/lib/units";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  MagnetType,
  MaterialPreset,
  MagnetizationType,
  FieldUnit,
  LengthUnit,
  FieldCalculationRequest,
  FieldCalculationResponse,
  LineCalculationRequest,
  LineCalculationResponse,
  CircleCalculationRequest,
  CircleCalculationResponse,
  ZeroCrossingsData,
  ReportSection,
  ReportRequest,
  ReportResponse,
} from "@shared/schema";

export default function Calculator() {
  const { toast } = useToast();
  const [magnetType, setMagnetType] = useState<MagnetType>("rectangular");
  const [magnetization, setMagnetization] = useState(0.22);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("mm");
  const [fieldUnit, setFieldUnit] = useState<FieldUnit>("mT");
  const [magnetizationType, setMagnetizationType] = useState<MagnetizationType>("axial");
  const [magnetizationAngle, setMagnetizationAngle] = useState(0);

  const [dimensions, setDimensions] = useState({
    length: 10,
    width: 5,
    height: 2,
    diameter: 20,
    innerDiameter: 15,
    thickness: 5,
    phi1: 0,
    phi2: 90,
    numPoles: 4,
    axisTiltAngle: 0,
  });

  const [calcPoint, setCalcPoint] = useState({ x: 0, y: 0, z: 1 });
  const [numFluxLines, setNumFluxLines] = useState(8);
  const [autoColorScale, setAutoColorScale] = useState(true);
  const [maxColorScale, setMaxColorScale] = useState(0.1);
  const [results, setResults] = useState<FieldCalculationResponse | null>(null);

  const [lineStart, setLineStart] = useState({ x: 0, y: 0, z: 0 });
  const [lineEnd, setLineEnd] = useState({ x: 0, y: 0, z: 5 });
  const [lineChartPlotlyData, setLineChartPlotlyData] = useState<any | null>(null);
  
  const [enableLine2, setEnableLine2] = useState(false);
  const [line2Start, setLine2Start] = useState({ x: 5, y: 0, z: 0 });
  const [line2End, setLine2End] = useState({ x: 5, y: 0, z: 5 });
  
  const [circleRadius, setCircleRadius] = useState(11);
  const [circleCenter, setCircleCenter] = useState({ x: 0, y: 0, z: 0 });
  const [circleNumSamples, setCircleNumSamples] = useState(360);
  const [circleChartPlotlyData, setCircleChartPlotlyData] = useState<any | null>(null);
  const [circleZeroCrossings, setCircleZeroCrossings] = useState<ZeroCrossingsData | null>(null);
  
  const [enableCircle2, setEnableCircle2] = useState(false);
  const [circle2Radius, setCircle2Radius] = useState(15);
  const [circle2Center, setCircle2Center] = useState({ x: 0, y: 0, z: 0 });
  
  const [showVisualization, setShowVisualization] = useState(false);
  const [visualizationLoading, setVisualizationLoading] = useState(false);

  // Report generation state
  const [reportGenerating, setReportGenerating] = useState(false);
  
  // Cache the actual requests that produced the current results
  const [lastPointRequest, setLastPointRequest] = useState<FieldCalculationRequest | null>(null);
  const [lastLineRequest, setLastLineRequest] = useState<LineCalculationRequest | null>(null);
  const [lastCircleRequest, setLastCircleRequest] = useState<CircleCalculationRequest | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (request: FieldCalculationRequest) => {
      const response = await apiRequest(
        "POST",
        "/api/calculate",
        request
      );
      const data = await response.json() as FieldCalculationResponse;
      return data;
    },
    onSuccess: (data, variables) => {
      setResults(data);
      setLastPointRequest(variables); // Cache the request that produced this result
      setShowVisualization(false);
      setLineChartPlotlyData(null);
      setCircleChartPlotlyData(null);
    },
  });

  const calculateLineMutation = useMutation({
    mutationFn: async (request: LineCalculationRequest) => {
      const response = await apiRequest(
        "POST",
        "/api/line-calculation",
        request
      );
      const data = await response.json() as LineCalculationResponse;
      return data;
    },
    onSuccess: (data, variables) => {
      if (data.plotlyJson) {
        setLineChartPlotlyData(JSON.parse(data.plotlyJson));
        setLastLineRequest(variables); // Cache the request that produced this chart
      }
    },
    onError: (error) => {
      console.error('Line calculation error:', error);
      setLineChartPlotlyData(null);
      setLastLineRequest(null);
    },
  });

  const calculateCircleMutation = useMutation({
    mutationFn: async (request: CircleCalculationRequest) => {
      const response = await apiRequest(
        "POST",
        "/api/circle-calculation",
        request
      );
      const data = await response.json() as CircleCalculationResponse;
      return data;
    },
    onSuccess: (data, variables) => {
      if (data.plotlyJson) {
        setCircleChartPlotlyData(JSON.parse(data.plotlyJson));
        setLastCircleRequest(variables); // Cache the request that produced this chart
      }
      if (data.zeroCrossings) {
        setCircleZeroCrossings(data.zeroCrossings);
      } else {
        setCircleZeroCrossings(null);
      }
    },
    onError: (error) => {
      console.error('Circle calculation error:', error);
      setCircleChartPlotlyData(null);
      setCircleZeroCrossings(null);
      setLastCircleRequest(null);
    },
  });

  // Report generation mutation
  const reportMutation = useMutation({
    mutationFn: async (request: ReportRequest) => {
      const response = await apiRequest(
        "POST",
        "/api/report",
        request
      );
      const data = await response.json() as ReportResponse;
      return data;
    },
    onSuccess: (data) => {
      // Convert base64 PDF to Blob and trigger download
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || 'magnetfeld_bericht.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setReportGenerating(false);
      toast({
        title: "Bericht erstellt",
        description: "PDF wurde erfolgreich heruntergeladen.",
      });
    },
    onError: (error) => {
      setReportGenerating(false);
      toast({
        title: "Fehler bei der Berichterstellung",
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    },
  });

  // Build field calculation request from current state
  const buildFieldRequest = (): FieldCalculationRequest => {
    const toMeters = (val: number | undefined) => {
      if (typeof val !== 'number' || isNaN(val) || val <= 0) {
        return 0.01;
      }
      return convertLength(val, lengthUnit, "m");
    };

    const request: FieldCalculationRequest = {
      type: magnetType,
      magnetization,
      magnetizationType,
      magnetizationAngle: magnetizationType === "radial" ? magnetizationAngle : undefined,
      axisTiltAngle: dimensions.axisTiltAngle || 0,
      length: toMeters(dimensions.length),
      width: toMeters(dimensions.width),
      height: toMeters(dimensions.height),
      diameter: toMeters(dimensions.diameter),
      innerDiameter: toMeters(dimensions.innerDiameter),
      thickness: toMeters(dimensions.thickness),
      phi1: dimensions.phi1,
      phi2: dimensions.phi2,
      numPoles: dimensions.numPoles,
      x: convertLength(calcPoint.x, lengthUnit, "m"),
      y: convertLength(calcPoint.y, lengthUnit, "m"),
      z: convertLength(calcPoint.z, lengthUnit, "m"),
    };
    return request;
  };

  // Build report payload with all available data using cached requests
  const buildReportPayload = (sections: ReportSection[]): ReportRequest => {
    const inputs: any = {};

    // Point calculation data - use cached request that produced the result
    if (sections.includes("point_calculation") && results && lastPointRequest) {
      inputs.point = {
        request: lastPointRequest,
        result: results,
      };
    }

    // Field visualization data - use cached point request
    if (sections.includes("field_visualization") && lastPointRequest) {
      inputs.visualization = lastPointRequest;
    }

    // Line measurement data - use cached request that produced the chart
    if (sections.includes("line_measurement") && lineChartPlotlyData && lastLineRequest) {
      inputs.line = [{
        request: lastLineRequest,
        plotlyJson: JSON.stringify(lineChartPlotlyData),
      }];
    }

    // Circle measurement data - use cached request that produced the chart
    if (sections.includes("circle_measurement") && circleChartPlotlyData && lastCircleRequest) {
      inputs.circle = [{
        request: lastCircleRequest,
        plotlyJson: JSON.stringify(circleChartPlotlyData),
        zeroCrossings: circleZeroCrossings || undefined,
      }];
    }

    // Zero crossings data (uses circle data) - use cached request
    if (sections.includes("zero_crossings") && circleZeroCrossings && lastCircleRequest) {
      if (!inputs.circle) {
        inputs.circle = [{
          request: lastCircleRequest,
          plotlyJson: circleChartPlotlyData ? JSON.stringify(circleChartPlotlyData) : undefined,
          zeroCrossings: circleZeroCrossings,
        }];
      }
    }

    return {
      sections,
      lengthUnit,
      fieldUnit,
      inputs,
    };
  };

  // Handle report generation
  const handleGenerateReport = async (sections: ReportSection[]) => {
    setReportGenerating(true);
    const payload = buildReportPayload(sections);
    reportMutation.mutate(payload);
  };

  // Available report sections - dynamically based on available data
  const availableSections = [
    {
      section: "documentation" as ReportSection,
      label: "Technische Dokumentation",
      description: "Allgemeine Informationen zu Berechnungsmethoden und Koordinatensystem",
      enabled: true,
    },
    {
      section: "point_calculation" as ReportSection,
      label: "Punktberechnung",
      description: `Feldstärke am Punkt (${calcPoint.x}, ${calcPoint.y}, ${calcPoint.z}) ${lengthUnit}`,
      enabled: !!results,
    },
    {
      section: "field_visualization" as ReportSection,
      label: "Feldvisualisierung",
      description: "2D Vektorfeld-Darstellung in der XZ-Ebene",
      enabled: !!results,
    },
    {
      section: "line_measurement" as ReportSection,
      label: "Linienmessung",
      description: "Feldstärke entlang einer Linie (Bx, By, Bz)",
      enabled: !!lineChartPlotlyData,
    },
    {
      section: "circle_measurement" as ReportSection,
      label: "Kreismessung",
      description: "Feldstärke auf Kreisbahn (Br, Bt, Bz)",
      enabled: !!circleChartPlotlyData,
    },
    {
      section: "zero_crossings" as ReportSection,
      label: "Nulldurchgänge",
      description: "Nulldurchgangs-Analyse für Multi-Segment-Ringe",
      enabled: !!circleZeroCrossings,
    },
  ];

  const handleDimensionChange = (key: string, value: number) => {
    setDimensions((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalcPointChange = (axis: "x" | "y" | "z", value: number) => {
    setCalcPoint((prev) => ({ ...prev, [axis]: value }));
  };

  const handleLineStartChange = (axis: "x" | "y" | "z", value: number) => {
    setLineStart((prev) => ({ ...prev, [axis]: value }));
  };

  const handleLineEndChange = (axis: "x" | "y" | "z", value: number) => {
    setLineEnd((prev) => ({ ...prev, [axis]: value }));
  };

  const buildLineRequest = (): LineCalculationRequest => {
    const magnetizationValue = magnetization;

    const toMeters = (val: number | undefined) => {
      if (typeof val !== 'number' || isNaN(val) || val <= 0) {
        return 0.01;
      }
      return convertLength(val, lengthUnit, "m");
    };

    const request: LineCalculationRequest = {
      type: magnetType,
      magnetization: magnetizationValue,
      magnetizationType: magnetizationType,
      magnetizationAngle: magnetizationAngle,
      axisTiltAngle: dimensions.axisTiltAngle || 0,
      startX: convertLength(lineStart.x, lengthUnit, "m"),
      startY: convertLength(lineStart.y, lengthUnit, "m"),
      startZ: convertLength(lineStart.z, lengthUnit, "m"),
      endX: convertLength(lineEnd.x, lengthUnit, "m"),
      endY: convertLength(lineEnd.y, lengthUnit, "m"),
      endZ: convertLength(lineEnd.z, lengthUnit, "m"),
      numPoints: 100,
    };

    if (enableLine2) {
      request.line2StartX = convertLength(line2Start.x, lengthUnit, "m");
      request.line2StartY = convertLength(line2Start.y, lengthUnit, "m");
      request.line2StartZ = convertLength(line2Start.z, lengthUnit, "m");
      request.line2EndX = convertLength(line2End.x, lengthUnit, "m");
      request.line2EndY = convertLength(line2End.y, lengthUnit, "m");
      request.line2EndZ = convertLength(line2End.z, lengthUnit, "m");
    }

    if (magnetType === "rectangular") {
      request.length = toMeters(dimensions.length);
      request.width = toMeters(dimensions.width);
      request.height = toMeters(dimensions.height);
    } else if (magnetType === "cylindrical") {
      request.diameter = toMeters(dimensions.diameter);
      request.length = toMeters(dimensions.length);
    } else if (magnetType === "ring") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
    } else if (magnetType === "ring_segment") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
      request.phi1 = dimensions.phi1 !== undefined ? dimensions.phi1 : 0;
      request.phi2 = dimensions.phi2 !== undefined ? dimensions.phi2 : 90;
    } else if (magnetType === "ring_multi_segment") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
      request.numPoles = dimensions.numPoles !== undefined ? dimensions.numPoles : 4;
    }

    return request;
  };

  const buildCircleRequest = (): CircleCalculationRequest => {
    const magnetizationValue = magnetization;

    const toMeters = (val: number | undefined) => {
      if (typeof val !== 'number' || isNaN(val) || val <= 0) {
        return 0.01;
      }
      return convertLength(val, lengthUnit, "m");
    };

    const request: CircleCalculationRequest = {
      type: magnetType,
      magnetization: magnetizationValue,
      magnetizationType: magnetizationType,
      magnetizationAngle: magnetizationAngle,
      axisTiltAngle: dimensions.axisTiltAngle || 0,
      // Circle inputs are always in mm (fixed in CircleFieldChart), so convert from mm to m
      radius: convertLength(circleRadius, "mm", "m"),
      centerX: convertLength(circleCenter.x, "mm", "m"),
      centerY: convertLength(circleCenter.y, "mm", "m"),
      centerZ: convertLength(circleCenter.z, "mm", "m"),
      numSamples: circleNumSamples,
    };

    if (enableCircle2) {
      request.circle2Radius = convertLength(circle2Radius, "mm", "m");
      request.circle2CenterX = convertLength(circle2Center.x, "mm", "m");
      request.circle2CenterY = convertLength(circle2Center.y, "mm", "m");
      request.circle2CenterZ = convertLength(circle2Center.z, "mm", "m");
    }

    if (magnetType === "rectangular") {
      request.length = toMeters(dimensions.length);
      request.width = toMeters(dimensions.width);
      request.height = toMeters(dimensions.height);
    } else if (magnetType === "cylindrical") {
      request.diameter = toMeters(dimensions.diameter);
      request.length = toMeters(dimensions.length);
    } else if (magnetType === "ring") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
    } else if (magnetType === "ring_segment") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
      request.phi1 = dimensions.phi1 !== undefined ? dimensions.phi1 : 0;
      request.phi2 = dimensions.phi2 !== undefined ? dimensions.phi2 : 90;
    } else if (magnetType === "ring_multi_segment") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
      request.numPoles = dimensions.numPoles !== undefined ? dimensions.numPoles : 4;
    }

    return request;
  };

  const handleCalculate = () => {
    if ((magnetType === "ring" || magnetType === "ring_segment" || magnetType === "ring_multi_segment") && dimensions.innerDiameter && dimensions.diameter) {
      if (dimensions.innerDiameter >= dimensions.diameter) {
        toast({
          title: "Ungültige Ringabmessungen",
          description: "Innendurchmesser muss kleiner als Außendurchmesser sein.",
          variant: "destructive",
        });
        return;
      }
    }

    if (magnetType === "ring_segment" && dimensions.phi1 !== undefined && dimensions.phi2 !== undefined) {
      if (dimensions.phi1 >= dimensions.phi2) {
        toast({
          title: "Ungültige Winkel",
          description: "Startwinkel φ₁ muss kleiner als Endwinkel φ₂ sein.",
          variant: "destructive",
        });
        return;
      }
    }

    const magnetizationValue = magnetization;

    const toMeters = (val: number | undefined) => {
      if (typeof val !== 'number' || isNaN(val) || val <= 0) {
        return 0.01;
      }
      return convertLength(val, lengthUnit, "m");
    };

    const request: FieldCalculationRequest = {
      type: magnetType,
      magnetization: magnetizationValue,
      magnetizationType: magnetizationType,
      magnetizationAngle: magnetizationAngle,
      axisTiltAngle: dimensions.axisTiltAngle || 0,
      x: convertLength(calcPoint.x, lengthUnit, "m"),
      y: convertLength(calcPoint.y, lengthUnit, "m"),
      z: convertLength(calcPoint.z, lengthUnit, "m"),
    };

    if (magnetType === "rectangular") {
      request.length = toMeters(dimensions.length);
      request.width = toMeters(dimensions.width);
      request.height = toMeters(dimensions.height);
    } else if (magnetType === "cylindrical") {
      request.diameter = toMeters(dimensions.diameter);
      request.length = toMeters(dimensions.length);
    } else if (magnetType === "ring") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
    } else if (magnetType === "ring_segment") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
      request.phi1 = dimensions.phi1 || 0;
      request.phi2 = dimensions.phi2 || 90;
    } else if (magnetType === "ring_multi_segment") {
      request.diameter = toMeters(dimensions.diameter);
      request.innerDiameter = toMeters(dimensions.innerDiameter);
      request.thickness = toMeters(dimensions.thickness);
      request.numPoles = dimensions.numPoles || 4;
    }

    calculateMutation.mutate(request);
  };

  useEffect(() => {
    if (magnetType === "rectangular") {
      setDimensions((prev) => ({ ...prev, length: 10, width: 8, height: 3 }));
      setMagnetizationType("axial");
    } else if (magnetType === "cylindrical") {
      setDimensions((prev) => ({ ...prev, diameter: 10, length: 10 }));
    } else if (magnetType === "ring") {
      setDimensions((prev) => ({ ...prev, diameter: 20, innerDiameter: 10, thickness: 5 }));
    } else if (magnetType === "ring_segment") {
      setDimensions((prev) => ({ ...prev, diameter: 20, innerDiameter: 10, thickness: 5, phi1: 0, phi2: 90 }));
      setLineStart({ x: 11, y: 0, z: 0 });
      setLineEnd({ x: 21, y: 0, z: 0 });
    } else if (magnetType === "ring_multi_segment") {
      setDimensions((prev) => ({ ...prev, diameter: 20, innerDiameter: 15, thickness: 5, numPoles: 4 }));
      setLineStart({ x: 11, y: 0, z: 0 });
      setLineEnd({ x: 21, y: 0, z: 0 });
    }
  }, [magnetType]);

  const handleVisualizationToggle = () => {
    if (!showVisualization) {
      setVisualizationLoading(true);
      setTimeout(() => {
        setShowVisualization(true);
        setVisualizationLoading(false);
      }, 100);
    } else {
      setShowVisualization(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <MagnetTypeSelector value={magnetType} onChange={setMagnetType} />

              <div className="border-t pt-4 sm:pt-6">
                <MaterialSelector
                  magnetization={magnetization}
                  onMagnetizationChange={setMagnetization}
                />
              </div>

              <div className="border-t pt-4 sm:pt-6">
                <DimensionInputs
                  magnetType={magnetType}
                  dimensions={dimensions}
                  lengthUnit={lengthUnit}
                  onDimensionChange={handleDimensionChange}
                  onLengthUnitChange={setLengthUnit}
                />
              </div>

              <div className="border-t pt-4 sm:pt-6">
                <MagnetizationControls
                  magnetType={magnetType}
                  magnetizationType={magnetizationType}
                  magnetizationAngle={magnetizationAngle}
                  onMagnetizationTypeChange={setMagnetizationType}
                  onMagnetizationAngleChange={setMagnetizationAngle}
                />
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <CalculationPointInputs
                x={calcPoint.x}
                y={calcPoint.y}
                z={calcPoint.z}
                onChange={handleCalcPointChange}
                unit={lengthUnit}
              />

              <div className="border-t pt-4 sm:pt-6">
                <UnitControls fieldUnit={fieldUnit} onFieldUnitChange={setFieldUnit} />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 border-t pt-4 sm:pt-6">
            <Button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-calculate"
            >
              {calculateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Berechnung läuft...
                </>
              ) : (
                <>
                  <CalcIcon className="mr-2 h-4 w-4" />
                  Feldstärke berechnen
                </>
              )}
            </Button>
          </div>
        </Card>

        {results && (
          <>
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Berichte</h3>
                <ReportDialog
                  onGenerateReport={handleGenerateReport}
                  availableSections={availableSections}
                  isGenerating={reportGenerating}
                />
              </div>
            </Card>

            <FieldResults
              Bx={convertField(Number(results.Bx) || 0, "T", fieldUnit)}
              By={convertField(Number(results.By) || 0, "T", fieldUnit)}
              Bz={convertField(Number(results.Bz) || 0, "T", fieldUnit)}
              magnitude={convertField(Number(results.magnitude) || 0, "T", fieldUnit)}
              distance={convertLength(Number(results.distance) || 0, "m", lengthUnit)}
              fieldUnit={fieldUnit}
              lengthUnit={lengthUnit}
              calcX={calcPoint.x}
              calcY={calcPoint.y}
              calcZ={calcPoint.z}
            />

            <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold">Feldverlauf entlang einer Linie</h3>
                <Button
                  onClick={() => calculateLineMutation.mutate(buildLineRequest())}
                  disabled={calculateLineMutation.isPending}
                  variant="default"
                  className="w-full sm:w-auto"
                  data-testid="button-calculate-line"
                >
                  {calculateLineMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Berechnet...
                    </>
                  ) : (
                    "Linie berechnen"
                  )}
                </Button>
              </div>
              <LineInputs
                startX={lineStart.x}
                startY={lineStart.y}
                startZ={lineStart.z}
                endX={lineEnd.x}
                endY={lineEnd.y}
                endZ={lineEnd.z}
                onStartXChange={(v) => handleLineStartChange("x", v)}
                onStartYChange={(v) => handleLineStartChange("y", v)}
                onStartZChange={(v) => handleLineStartChange("z", v)}
                onEndXChange={(v) => handleLineEndChange("x", v)}
                onEndYChange={(v) => handleLineEndChange("y", v)}
                onEndZChange={(v) => handleLineEndChange("z", v)}
                lengthUnit={lengthUnit}
              />

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="enableLine2"
                      checked={enableLine2}
                      onCheckedChange={(checked) => setEnableLine2(checked === true)}
                      data-testid="checkbox-enable-line2"
                    />
                    <Label htmlFor="enableLine2" className="text-sm cursor-pointer">
                      Zweite Linie hinzufügen
                    </Label>
                  </div>

                  {enableLine2 && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Linie 2: Startpunkt ({lengthUnit})</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="line2-start-x" className="text-xs">X</Label>
                            <Input
                              id="line2-start-x"
                              type="number"
                              value={line2Start.x}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLine2Start(prev => ({ ...prev, x: val === '' ? 0 : parseFloat(val) }));
                              }}
                              step="0.1"
                              className="h-8 text-sm"
                              data-testid="input-line2-start-x"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line2-start-y" className="text-xs">Y</Label>
                            <Input
                              id="line2-start-y"
                              type="number"
                              value={line2Start.y}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLine2Start(prev => ({ ...prev, y: val === '' ? 0 : parseFloat(val) }));
                              }}
                              step="0.1"
                              className="h-8 text-sm"
                              data-testid="input-line2-start-y"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line2-start-z" className="text-xs">Z</Label>
                            <Input
                              id="line2-start-z"
                              type="number"
                              value={line2Start.z}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLine2Start(prev => ({ ...prev, z: val === '' ? 0 : parseFloat(val) }));
                              }}
                              step="0.1"
                              className="h-8 text-sm"
                              data-testid="input-line2-start-z"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Linie 2: Endpunkt ({lengthUnit})</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="line2-end-x" className="text-xs">X</Label>
                            <Input
                              id="line2-end-x"
                              type="number"
                              value={line2End.x}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLine2End(prev => ({ ...prev, x: val === '' ? 0 : parseFloat(val) }));
                              }}
                              step="0.1"
                              className="h-8 text-sm"
                              data-testid="input-line2-end-x"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line2-end-y" className="text-xs">Y</Label>
                            <Input
                              id="line2-end-y"
                              type="number"
                              value={line2End.y}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLine2End(prev => ({ ...prev, y: val === '' ? 0 : parseFloat(val) }));
                              }}
                              step="0.1"
                              className="h-8 text-sm"
                              data-testid="input-line2-end-y"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line2-end-z" className="text-xs">Z</Label>
                            <Input
                              id="line2-end-z"
                              type="number"
                              value={line2End.z}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLine2End(prev => ({ ...prev, z: val === '' ? 0 : parseFloat(val) }));
                              }}
                              step="0.1"
                              className="h-8 text-sm"
                              data-testid="input-line2-end-z"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <LineFieldChart
                plotlyData={lineChartPlotlyData}
                isLoading={calculateLineMutation.isPending}
                error={calculateLineMutation.isError ? 'Fehler bei der Berechnung' : undefined}
              />
            </Card>

            {(magnetType === "ring" || magnetType === "ring_segment" || magnetType === "ring_multi_segment") && (
              <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Kreisförmige Messung (Br, Bt, Bz vs. Winkel)</h3>
                  <Button
                    onClick={() => calculateCircleMutation.mutate(buildCircleRequest())}
                    disabled={calculateCircleMutation.isPending}
                    variant="default"
                    className="w-full sm:w-auto"
                    data-testid="button-calculate-circle"
                  >
                    {calculateCircleMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Berechnet...
                      </>
                    ) : (
                      "Kreis berechnen"
                    )}
                  </Button>
                </div>
                <CircleFieldChart
                  plotlyData={circleChartPlotlyData}
                  isLoading={calculateCircleMutation.isPending}
                  error={calculateCircleMutation.isError ? 'Kreismessung fehlgeschlagen' : undefined}
                  radius={circleRadius}
                  centerX={circleCenter.x}
                  centerY={circleCenter.y}
                  centerZ={circleCenter.z}
                  numSamples={circleNumSamples}
                  onRadiusChange={setCircleRadius}
                  onCenterXChange={(v) => setCircleCenter(prev => ({ ...prev, x: v }))}
                  onCenterYChange={(v) => setCircleCenter(prev => ({ ...prev, y: v }))}
                  onCenterZChange={(v) => setCircleCenter(prev => ({ ...prev, z: v }))}
                  onNumSamplesChange={setCircleNumSamples}
                  enableCircle2={enableCircle2}
                  circle2Radius={circle2Radius}
                  circle2CenterX={circle2Center.x}
                  circle2CenterY={circle2Center.y}
                  circle2CenterZ={circle2Center.z}
                  onEnableCircle2Change={setEnableCircle2}
                  onCircle2RadiusChange={setCircle2Radius}
                  onCircle2CenterXChange={(v) => setCircle2Center(prev => ({ ...prev, x: v }))}
                  onCircle2CenterYChange={(v) => setCircle2Center(prev => ({ ...prev, y: v }))}
                  onCircle2CenterZChange={(v) => setCircle2Center(prev => ({ ...prev, z: v }))}
                  zeroCrossings={circleZeroCrossings}
                  magnetType={magnetType}
                />
              </Card>
            )}

            <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold">Feldvisualisierung (2D Schnittebene)</h3>
                <Button
                  onClick={handleVisualizationToggle}
                  disabled={visualizationLoading}
                  variant={showVisualization ? "secondary" : "default"}
                  className="w-full sm:w-auto"
                  data-testid="button-toggle-visualization"
                >
                  {visualizationLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lädt...
                    </>
                  ) : showVisualization ? (
                    "Visualisierung ausblenden"
                  ) : (
                    "Visualisierung anzeigen"
                  )}
                </Button>
              </div>

              {showVisualization && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 border-t pt-3 sm:pt-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Anzahl Feldlinien</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="4"
                          max="10"
                          step="2"
                          value={numFluxLines}
                          onChange={(e) => setNumFluxLines(Number(e.target.value))}
                          className="flex-1"
                          data-testid="input-num-flux-lines"
                        />
                        <span className="text-sm font-mono text-muted-foreground w-12 text-right">
                          {numFluxLines}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Farbskala Maximum</label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          id="auto-color-scale"
                          checked={autoColorScale}
                          onChange={(e) => setAutoColorScale(e.target.checked)}
                          className="h-4 w-4"
                          data-testid="checkbox-auto-color-scale"
                        />
                        <label htmlFor="auto-color-scale" className="text-sm text-muted-foreground cursor-pointer">
                          Automatisch
                        </label>
                      </div>
                      {!autoColorScale && (
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0.001"
                            max="10"
                            step="0.01"
                            value={maxColorScale}
                            onChange={(e) => setMaxColorScale(Number(e.target.value))}
                            className="flex-1 px-3 py-2 border rounded-md"
                            data-testid="input-max-color-scale"
                          />
                          <span className="text-sm text-muted-foreground">T</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <FieldVisualization
                    magnetType={magnetType}
                    dimensions={dimensions}
                    magnetization={magnetization}
                    magnetizationType={magnetizationType}
                    magnetizationAngle={magnetizationAngle}
                    calcX={calcPoint.x}
                    calcY={calcPoint.y}
                    calcZ={calcPoint.z}
                    Bx={Number(results.Bx) || 0}
                    By={Number(results.By) || 0}
                    Bz={Number(results.Bz) || 0}
                    numFluxLines={numFluxLines}
                    maxColorScale={autoColorScale ? undefined : maxColorScale}
                    lineStartX={lineStart.x}
                    lineStartY={lineStart.y}
                    lineStartZ={lineStart.z}
                    lineEndX={lineEnd.x}
                    lineEndY={lineEnd.y}
                    lineEndZ={lineEnd.z}
                    circleRadius={circleRadius}
                    circleCenterX={circleCenter.x}
                    circleCenterY={circleCenter.y}
                    circleCenterZ={circleCenter.z}
                    enableLine2={enableLine2}
                    line2StartX={line2Start.x}
                    line2StartY={line2Start.y}
                    line2StartZ={line2Start.z}
                    line2EndX={line2End.x}
                    line2EndY={line2End.y}
                    line2EndZ={line2End.z}
                    enableCircle2={enableCircle2}
                    circle2Radius={circle2Radius}
                    circle2CenterX={circle2Center.x}
                    circle2CenterY={circle2Center.y}
                    circle2CenterZ={circle2Center.z}
                  />
                </>
              )}
            </Card>
          </>
        )}

        <FormulaDisplay magnetType={magnetType} />
      </main>
    </div>
  );
}
