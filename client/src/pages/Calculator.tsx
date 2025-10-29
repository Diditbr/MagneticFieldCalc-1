import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator as CalcIcon, Loader2 } from "lucide-react";
import { MagnetTypeSelector } from "@/components/MagnetTypeSelector";
import { MaterialSelector } from "@/components/MaterialSelector";
import { DimensionInputs } from "@/components/DimensionInputs";
import { CalculationPointInputs } from "@/components/CalculationPointInputs";
import { UnitControls } from "@/components/UnitControls";
import { FieldResults } from "@/components/FieldResults";
import { FieldVisualization } from "@/components/FieldVisualization";
import { FormulaDisplay } from "@/components/FormulaDisplay";
import { convertLength, convertField } from "@/lib/units";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  MagnetType,
  MaterialPreset,
  FieldUnit,
  LengthUnit,
  FieldCalculationRequest,
  FieldCalculationResponse,
} from "@shared/schema";

export default function Calculator() {
  const [magnetType, setMagnetType] = useState<MagnetType>("bar");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialPreset>("NdFeB N42");
  const [customMagnetization, setCustomMagnetization] = useState(1.0);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("cm");
  const [fieldUnit, setFieldUnit] = useState<FieldUnit>("mT");

  const [dimensions, setDimensions] = useState({
    length: 10,
    width: 5,
    height: 2,
    diameter: 10,
    innerDiameter: 5,
    thickness: 5,
  });

  const [calcPoint, setCalcPoint] = useState({ x: 0, y: 0, z: 15 });
  const [results, setResults] = useState<FieldCalculationResponse | null>(null);

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
    },
  });

  const handleDimensionChange = (key: string, value: number) => {
    setDimensions((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalcPointChange = (axis: "x" | "y" | "z", value: number) => {
    setCalcPoint((prev) => ({ ...prev, [axis]: value }));
  };

  const handleCalculate = () => {
    const magnetizationValue =
      selectedMaterial === "Custom"
        ? customMagnetization
        : (materialPresets as any)[selectedMaterial];

    const toMeters = (val: number | undefined, fallback: number = 0.01) => {
      const numVal = typeof val === 'number' && !isNaN(val) ? val : fallback;
      return convertLength(numVal, lengthUnit, "m");
    };

    const request: FieldCalculationRequest = {
      type: magnetType,
      magnetization: magnetizationValue,
      x: toMeters(calcPoint.x, 0),
      y: toMeters(calcPoint.y, 0),
      z: toMeters(calcPoint.z, 0),
    };

    if (magnetType === "bar" || magnetType === "rectangular") {
      request.length = toMeters(dimensions.length, 10);
      request.width = toMeters(dimensions.width, 5);
      request.height = toMeters(dimensions.height, 2);
    } else if (magnetType === "cylindrical") {
      request.diameter = toMeters(dimensions.diameter, 10);
      request.length = toMeters(dimensions.length, 10);
    } else if (magnetType === "ring") {
      request.diameter = toMeters(dimensions.diameter, 10);
      request.innerDiameter = toMeters(dimensions.innerDiameter, 5);
      request.thickness = toMeters(dimensions.thickness, 5);
    }

    calculateMutation.mutate(request);
  };

  useEffect(() => {
    if (magnetType === "bar") {
      setDimensions((prev) => ({ ...prev, length: 10, width: 5, height: 2 }));
    } else if (magnetType === "cylindrical") {
      setDimensions((prev) => ({ ...prev, diameter: 10, length: 10 }));
    } else if (magnetType === "rectangular") {
      setDimensions((prev) => ({ ...prev, length: 10, width: 8, height: 3 }));
    } else if (magnetType === "ring") {
      setDimensions((prev) => ({ ...prev, diameter: 10, innerDiameter: 5, thickness: 5 }));
    }
  }, [magnetType]);

  const materialPresets = {
    "NdFeB N52": 1.48,
    "NdFeB N42": 1.32,
    "SmCo": 1.05,
    "Ferrite (Ceramic)": 0.39,
    "AlNiCo 5": 1.28,
    "Custom": 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Magnetic Field Calculator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate magnetic fields from permanent magnets
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6 space-y-6">
              <MagnetTypeSelector value={magnetType} onChange={setMagnetType} />

              <div className="border-t pt-6">
                <MaterialSelector
                  selectedMaterial={selectedMaterial}
                  customMagnetization={customMagnetization}
                  onMaterialChange={setSelectedMaterial}
                  onCustomMagnetizationChange={setCustomMagnetization}
                />
              </div>

              <div className="border-t pt-6">
                <DimensionInputs
                  magnetType={magnetType}
                  dimensions={dimensions}
                  lengthUnit={lengthUnit}
                  onDimensionChange={handleDimensionChange}
                  onLengthUnitChange={setLengthUnit}
                />
              </div>

              <div className="border-t pt-6">
                <CalculationPointInputs
                  x={calcPoint.x}
                  y={calcPoint.y}
                  z={calcPoint.z}
                  onChange={handleCalcPointChange}
                  unit={lengthUnit}
                />
              </div>

              <div className="border-t pt-6">
                <UnitControls fieldUnit={fieldUnit} onFieldUnitChange={setFieldUnit} />
              </div>

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
                    Calculating...
                  </>
                ) : (
                  <>
                    <CalcIcon className="mr-2 h-4 w-4" />
                    Calculate Field
                  </>
                )}
              </Button>
            </Card>
          </div>

          <div className="space-y-6">
            {results ? (
              <>
                <FieldResults
                  Bx={convertField(Number(results.Bx) || 0, "T", fieldUnit)}
                  By={convertField(Number(results.By) || 0, "T", fieldUnit)}
                  Bz={convertField(Number(results.Bz) || 0, "T", fieldUnit)}
                  magnitude={convertField(Number(results.magnitude) || 0, "T", fieldUnit)}
                  distance={convertLength(Number(results.distance) || 0, "m", lengthUnit)}
                  fieldUnit={fieldUnit}
                  lengthUnit={lengthUnit}
                />

                <FieldVisualization
                  magnetType={magnetType}
                  calcX={calcPoint.x}
                  calcY={calcPoint.y}
                  calcZ={calcPoint.z}
                  Bx={Number(results.Bx) || 0}
                  By={Number(results.By) || 0}
                  Bz={Number(results.Bz) || 0}
                />
              </>
            ) : (
              <Card className="p-12">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <CalcIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Ready to Calculate</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Configure your magnet parameters and calculation point, then click Calculate to
                    see the magnetic field results and visualization.
                  </p>
                </div>
              </Card>
            )}

            <FormulaDisplay magnetType={magnetType} />
          </div>
        </div>
      </main>
    </div>
  );
}
