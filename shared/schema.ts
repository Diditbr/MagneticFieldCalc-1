import { z } from "zod";

// Magnet type enumeration
export const magnetTypes = ["bar", "cylindrical", "rectangular", "ring"] as const;
export type MagnetType = typeof magnetTypes[number];

// Material presets with typical magnetization values (in Tesla)
export const materialPresets = {
  "NdFeB N52": 1.48,
  "NdFeB N42": 1.32,
  "SmCo": 1.05,
  "Ferrite (Ceramic)": 0.39,
  "AlNiCo 5": 1.28,
  "Custom": 0,
} as const;

export type MaterialPreset = keyof typeof materialPresets;

// Unit types
export const fieldUnits = ["T", "mT", "G", "kG"] as const;
export const lengthUnits = ["mm", "cm", "m", "in"] as const;

export type FieldUnit = typeof fieldUnits[number];
export type LengthUnit = typeof lengthUnits[number];

// Magnet configuration schema
export const magnetConfigSchema = z.object({
  type: z.enum(magnetTypes),
  material: z.string(),
  magnetization: z.number().positive(), // in Tesla
  
  // Dimensions (all in meters internally)
  length: z.number().positive().optional(), // for bar/rectangular
  width: z.number().positive().optional(), // for rectangular
  height: z.number().positive().optional(), // for bar/rectangular
  diameter: z.number().positive().optional(), // for cylindrical/ring
  innerDiameter: z.number().positive().optional(), // for ring
  thickness: z.number().positive().optional(), // for ring
  
  // Calculation point (in meters from magnet center)
  calcX: z.number(),
  calcY: z.number(),
  calcZ: z.number(),
  
  // Units for display
  lengthUnit: z.enum(lengthUnits),
  fieldUnit: z.enum(fieldUnits),
});

export type MagnetConfig = z.infer<typeof magnetConfigSchema>;

// Field calculation request
export const fieldCalculationRequestSchema = z.object({
  type: z.enum(magnetTypes),
  magnetization: z.number().positive(),
  
  // Dimensions in meters
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  innerDiameter: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  
  // Calculation point in meters
  x: z.number(),
  y: z.number(),
  z: z.number(),
}).refine(
  (data) => {
    if (data.type === "ring" && data.innerDiameter && data.diameter) {
      return data.innerDiameter < data.diameter;
    }
    return true;
  },
  {
    message: "Inner diameter must be smaller than outer diameter for ring magnets",
    path: ["innerDiameter"],
  }
);

export type FieldCalculationRequest = z.infer<typeof fieldCalculationRequestSchema>;

// Field calculation response (in Tesla)
export const fieldCalculationResponseSchema = z.object({
  Bx: z.number(),
  By: z.number(),
  Bz: z.number(),
  magnitude: z.number(),
  distance: z.number(),
});

export type FieldCalculationResponse = z.infer<typeof fieldCalculationResponseSchema>;

// Field line visualization data
export const fieldLineDataSchema = z.object({
  points: z.array(z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  })),
  strength: z.number(),
});

export type FieldLineData = z.infer<typeof fieldLineDataSchema>;
