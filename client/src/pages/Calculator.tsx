import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator as CalcIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
} from "@shared/schema";
import { materialPresets } from "@shared/schema";

export default function Calculator() {
  const { toast } = useToast();
  const [magnetType, setMagnetType] = useState<MagnetType>("rectangular");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialPreset>("NdFeB N42");
  const [customMagnetization, setCustomMagnetization] = useState(1.0);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("mm");
  const [fieldUnit, setFieldUnit] = useState<FieldUnit>("mT");
  const [magnetizationType, setMagnetizationType] = useState<MagnetizationType>("axial");
  const [magnetizationAngle, setMagnetizationAngle] = useState(0);

  const [dimensions, setDimensions] = useState({
    length: 10,
    width: 5,
    height: 2,
    diameter: 10,
    innerDiameter: 5,
    thickness: 5,
    phi1: 0,
    phi2: 90,
    numPoles: 4,
  });

  const [calcPoint, setCalcPoint] = useState({ x: 0, y: 0, z: 1 });
  const [numFluxLines, setNumFluxLines] = useState(8);
  const [autoColorScale, setAutoColorScale] = useState(true);
  const [maxColorScale, setMaxColorScale] = useState(0.1);
  const [results, setResults] = useState<FieldCalculationResponse | null>(null);

  const [lineStart, setLineStart] = useState({ x: 0, y: 0, z: 0 });
  const [lineEnd, setLineEnd] = useState({ x: 0, y: 0, z: 5 });
  const [lineChartPlotlyData, setLineChartPlotlyData] = useState<any | null>(null);
  
  const [circleRadius, setCircleRadius] = useState(15);
  const [circleCenter, setCircleCenter] = useState({ x: 0, y: 0, z: 0 });
  const [circleNumSamples, setCircleNumSamples] = useState(360);
  const [circleChartPlotlyData, setCircleChartPlotlyData] = useState<any | null>(null);
  
  const [showVisualization, setShowVisualization] = useState(false);
  const [visualizationLoading, setVisualizationLoading] = useState(false);

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
    onSuccess: (data) => {
      setResults(data);
      setShowVisualization(false);
      calculateLineMutation.mutate(buildLineRequest());
      
      if (magnetType === "ring_multi_segment") {
        calculateCircleMutation.mutate(buildCircleRequest());
      }
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
    onSuccess: (data) => {
      if (data.plotlyJson) {
        setLineChartPlotlyData(JSON.parse(data.plotlyJson));
      }
    },
    onError: (error) => {
      console.error('Line calculation error:', error);
      setLineChartPlotlyData(null);
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
    onSuccess: (data) => {
      if (data.plotlyJson) {
        setCircleChartPlotlyData(JSON.parse(data.plotlyJson));
      }
    },
    onError: (error) => {
      console.error('Circle calculation error:', error);
      setCircleChartPlotlyData(null);
    },
  });

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
    const magnetizationValue =
      selectedMaterial === "Custom"
        ? customMagnetization
        : materialPresets[selectedMaterial];

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
      startX: convertLength(lineStart.x, lengthUnit, "m"),
      startY: convertLength(lineStart.y, lengthUnit, "m"),
      startZ: convertLength(lineStart.z, lengthUnit, "m"),
      endX: convertLength(lineEnd.x, lengthUnit, "m"),
      endY: convertLength(lineEnd.y, lengthUnit, "m"),
      endZ: convertLength(lineEnd.z, lengthUnit, "m"),
      numPoints: 100,
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
    const magnetizationValue =
      selectedMaterial === "Custom"
        ? customMagnetization
        : materialPresets[selectedMaterial];

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
      // Circle inputs are always in mm (fixed in CircleFieldChart), so convert from mm to m
      radius: convertLength(circleRadius, "mm", "m"),
      centerX: convertLength(circleCenter.x, "mm", "m"),
      centerY: convertLength(circleCenter.y, "mm", "m"),
      centerZ: convertLength(circleCenter.z, "mm", "m"),
      numSamples: circleNumSamples,
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

    const magnetizationValue =
      selectedMaterial === "Custom"
        ? customMagnetization
        : materialPresets[selectedMaterial];

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
      setDimensions((prev) => ({ ...prev, diameter: 10, innerDiameter: 5, thickness: 5 }));
    } else if (magnetType === "ring_segment") {
      setDimensions((prev) => ({ ...prev, diameter: 10, innerDiameter: 5, thickness: 5, phi1: 0, phi2: 90 }));
    } else if (magnetType === "ring_multi_segment") {
      setDimensions((prev) => ({ ...prev, diameter: 10, innerDiameter: 5, thickness: 5, numPoles: 4 }));
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
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold">Magnetic Field Calculator</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Calculate magnetic fields from permanent magnets
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <MagnetTypeSelector value={magnetType} onChange={setMagnetType} />

              <div className="border-t pt-4 sm:pt-6">
                <MaterialSelector
                  selectedMaterial={selectedMaterial}
                  customMagnetization={customMagnetization}
                  onMaterialChange={setSelectedMaterial}
                  onCustomMagnetizationChange={setCustomMagnetization}
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
              <h3 className="text-base sm:text-lg font-semibold">Feldverlauf entlang einer Linie</h3>
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
              
              <LineFieldChart
                plotlyData={lineChartPlotlyData}
                isLoading={calculateLineMutation.isPending}
                error={calculateLineMutation.isError ? 'Fehler bei der Berechnung' : undefined}
              />
            </Card>

            {magnetType === "ring_multi_segment" && (
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
              />
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
                          max="40"
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
                    magnetization={
                      selectedMaterial === "Custom"
                        ? customMagnetization
                        : materialPresets[selectedMaterial]
                    }
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
