import { z } from "zod";

// Magnet type enumeration
export const magnetTypes = ["cylindrical", "rectangular", "ring"] as const;
export type MagnetType = typeof magnetTypes[number];

// Magnetization type enumeration
export const magnetizationTypes = ["axial", "diametral"] as const;
export type MagnetizationType = typeof magnetizationTypes[number];

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
  magnetizationType: z.enum(magnetizationTypes).default("axial"),
  magnetizationAngle: z.number().min(0).max(360).optional(), // Angle in degrees for diametral
  
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

// Field grid request for 2D cross-section visualization
export const fieldGridRequestSchema = z.object({
  type: z.enum(magnetTypes),
  magnetization: z.number().positive(),
  
  // Dimensions in meters
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  innerDiameter: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  
  // Grid parameters for X-Z plane (Y=0 cross-section)
  xMin: z.number(),
  xMax: z.number(),
  zMin: z.number(),
  zMax: z.number(),
  gridSize: z.number().int().positive().default(30), // Number of points per dimension
});

export type FieldGridRequest = z.infer<typeof fieldGridRequestSchema>;

// Field grid response - 2D array of B field vectors
export const fieldGridResponseSchema = z.object({
  xValues: z.array(z.number()),
  zValues: z.array(z.number()),
  Bx: z.array(z.array(z.number())), // 2D array [z][x]
  Bz: z.array(z.array(z.number())), // 2D array [z][x]
});

export type FieldGridResponse = z.infer<typeof fieldGridResponseSchema>;

// Field visualization request
export const fieldVisualizationRequestSchema = z.object({
  type: z.enum(magnetTypes),
  magnetization: z.number().positive(),
  magnetizationType: z.enum(magnetizationTypes).default("axial"),
  magnetizationAngle: z.number().min(0).max(360).optional(), // Angle in degrees for diametral
  
  // Dimensions in meters
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  innerDiameter: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  
  // Optional calculation point (in meters)
  calcX: z.number().optional(),
  calcY: z.number().optional(),
  calcZ: z.number().optional(),
  
  // Optional line to display (in meters)
  lineStartX: z.number().optional(),
  lineStartY: z.number().optional(),
  lineStartZ: z.number().optional(),
  lineEndX: z.number().optional(),
  lineEndY: z.number().optional(),
  lineEndZ: z.number().optional(),
  
  // Visualization parameters
  numFluxLines: z.number().int().positive().default(8),
  maxColorScale: z.number().positive().optional(), // Max value for color scale (min is always 0)
});

export type FieldVisualizationRequest = z.infer<typeof fieldVisualizationRequestSchema>;

// Line calculation request - for computing field along a line
export const lineCalculationRequestSchema = z.object({
  type: z.enum(magnetTypes),
  magnetization: z.number().positive(),
  magnetizationType: z.enum(magnetizationTypes).default("axial"),
  magnetizationAngle: z.number().min(0).max(360).optional(),
  
  // Dimensions in meters
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  innerDiameter: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  
  // Line start point in meters
  startX: z.number(),
  startY: z.number(),
  startZ: z.number(),
  
  // Line end point in meters
  endX: z.number(),
  endY: z.number(),
  endZ: z.number(),
  
  // Number of points along the line
  numPoints: z.number().int().min(10).max(200).default(100),
});

export type LineCalculationRequest = z.infer<typeof lineCalculationRequestSchema>;

// Line calculation response - base64 encoded chart image
export const lineCalculationResponseSchema = z.object({
  image: z.string(), // base64 encoded PNG
});

export type LineCalculationResponse = z.infer<typeof lineCalculationResponseSchema>;
