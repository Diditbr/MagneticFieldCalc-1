import type { FieldUnit, LengthUnit } from "@shared/schema";

// Field unit conversions (from Tesla)
export const fieldConversions: Record<FieldUnit, number> = {
  T: 1,
  mT: 1000,
  G: 10000,
  kG: 10,
};

// Length unit conversions (from meters)
export const lengthConversions: Record<LengthUnit, number> = {
  m: 1,
  cm: 100,
  mm: 1000,
  in: 39.3701,
};

export function convertField(value: number, fromUnit: FieldUnit, toUnit: FieldUnit): number {
  return (value * fieldConversions[toUnit]) / fieldConversions[fromUnit];
}

export function convertLength(value: number, fromUnit: LengthUnit, toUnit: LengthUnit): number {
  return (value * lengthConversions[toUnit]) / lengthConversions[fromUnit];
}

export function formatFieldValue(value: number, unit: FieldUnit): string {
  const absValue = Math.abs(value);
  
  if (absValue === 0) return "0";
  if (absValue >= 1000) return value.toExponential(3);
  if (absValue >= 1) return value.toFixed(4);
  if (absValue >= 0.001) return value.toFixed(6);
  return value.toExponential(3);
}

export function formatLengthValue(value: number): string {
  return value.toString();
}
