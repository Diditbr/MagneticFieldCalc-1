import { z } from "zod";

// Magnet type enumeration
export const magnetTypes = ["cylindrical", "rectangular", "ring", "ring_segment", "ring_multi_segment"] as const;
export type MagnetType = typeof magnetTypes[number];

// Ring segment definition for multi-segment rings
export const ringSegmentSchema = z.object({
  widthDegrees: z.number().positive().max(360), // Segment width in degrees
  // Optional magnetization override (if not provided, alternates automatically)
  magnetizationMultiplier: z.number().min(-1).max(1).optional(), // 1 or -1 for N/S
});

export type RingSegment = z.infer<typeof ringSegmentSchema>;

// Magnetization type enumeration
export const magnetizationTypes = ["axial", "diametral", "radial"] as const;
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
  diameter: z.number().positive().optional(), // for cylindrical/ring/ring_segment
  innerDiameter: z.number().positive().optional(), // for ring/ring_segment
  thickness: z.number().positive().optional(), // for ring/ring_segment
  phi1: z.number().min(0).max(360).optional(), // for ring_segment (start angle in degrees)
  phi2: z.number().min(0).max(360).optional(), // for ring_segment (end angle in degrees)
  
  // Multi-segment ring parameters
  numPoles: z.number().int().min(2).max(36).optional(), // Number of poles/segments
  segments: z.array(ringSegmentSchema).optional(), // Custom segment definitions
  
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
  axisTiltAngle: z.number().min(-90).max(90).optional().default(0), // Deviation from Z-axis in degrees for cylindrical/ring/ring_segment
  
  // Dimensions in meters
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  innerDiameter: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  phi1: z.number().min(0).max(360).optional(), // for ring_segment
  phi2: z.number().min(0).max(360).optional(), // for ring_segment
  
  // Multi-segment ring parameters
  numPoles: z.number().int().min(2).max(36).optional(),
  segments: z.array(ringSegmentSchema).optional(),
  
  // Calculation point in meters
  x: z.number(),
  y: z.number(),
  z: z.number(),
}).refine(
  (data) => {
    if ((data.type === "ring" || data.type === "ring_segment") && data.innerDiameter && data.diameter) {
      return data.innerDiameter < data.diameter;
    }
    return true;
  },
  {
    message: "Inner diameter must be smaller than outer diameter for ring magnets",
    path: ["innerDiameter"],
  }
).refine(
  (data) => {
    if (data.type === "ring_segment" && data.phi1 !== undefined && data.phi2 !== undefined) {
      return data.phi1 < data.phi2;
    }
    return true;
  },
  {
    message: "Start angle (φ1) must be smaller than end angle (φ2)",
    path: ["phi1"],
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
  axisTiltAngle: z.number().min(-90).max(90).optional().default(0), // Deviation from Z-axis in degrees for cylindrical/ring/ring_segment
  
  // Dimensions in meters
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  innerDiameter: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  phi1: z.number().min(0).max(360).optional(), // for ring_segment
  phi2: z.number().min(0).max(360).optional(), // for ring_segment
  
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
  axisTiltAngle: z.number().min(-90).max(90).optional().default(0), // Deviation from Z-axis in degrees for cylindrical/ring/ring_segment
  
  // Dimensions in meters
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  innerDiameter: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  phi1: z.number().min(0).max(360).optional(), // for ring_segment
  phi2: z.number().min(0).max(360).optional(), // for ring_segment
  
  // Multi-segment ring parameters
  numPoles: z.number().int().min(2).max(36).optional(),
  segments: z.array(ringSegmentSchema).optional(),
  
  // Line start point in meters
  startX: z.number(),
  startY: z.number(),
  startZ: z.number(),
  
  // Line end point in meters
  endX: z.number(),
  endY: z.number(),
  endZ: z.number(),
  
  // Optional second line start/end points in meters
  line2StartX: z.number().optional(),
  line2StartY: z.number().optional(),
  line2StartZ: z.number().optional(),
  line2EndX: z.number().optional(),
  line2EndY: z.number().optional(),
  line2EndZ: z.number().optional(),
  
  // Number of points along the line
  numPoints: z.number().int().min(10).max(200).default(100),
});

export type LineCalculationRequest = z.infer<typeof lineCalculationRequestSchema>;

// Line calculation response - Plotly JSON chart
export const lineCalculationResponseSchema = z.object({
  plotlyJson: z.string(), // Plotly JSON format
});

export type LineCalculationResponse = z.infer<typeof lineCalculationResponseSchema>;

// Circle calculation request - for computing field along a circular path
export const circleCalculationRequestSchema = z.object({
  type: z.enum(magnetTypes),
  magnetization: z.number().positive(),
  magnetizationType: z.enum(magnetizationTypes).default("axial"),
  magnetizationAngle: z.number().min(0).max(360).optional(),
  axisTiltAngle: z.number().min(-90).max(90).optional().default(0), // Deviation from Z-axis in degrees for cylindrical/ring/ring_segment
  
  // Dimensions in meters
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  innerDiameter: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  phi1: z.number().min(0).max(360).optional(), // for ring_segment
  phi2: z.number().min(0).max(360).optional(), // for ring_segment
  
  // Multi-segment ring parameters
  numPoles: z.number().int().min(2).max(36).optional(),
  segments: z.array(ringSegmentSchema).optional(),
  
  // Circle parameters
  radius: z.number().positive(), // Circle radius in meters
  centerX: z.number().default(0), // Circle center X offset in meters
  centerY: z.number().default(0), // Circle center Y offset in meters
  centerZ: z.number().default(0), // Circle center Z offset in meters
  
  // Optional second circle parameters
  circle2Radius: z.number().positive().optional(),
  circle2CenterX: z.number().optional(),
  circle2CenterY: z.number().optional(),
  circle2CenterZ: z.number().optional(),
  
  // Sampling parameters
  numSamples: z.number().int().min(36).max(1440).default(360), // Number of angle samples
});

export type CircleCalculationRequest = z.infer<typeof circleCalculationRequestSchema>;

// Zero crossing data for multi-segment rings
export const zeroCrossingSchema = z.object({
  poleIndex: z.number().int(),
  expectedAngle: z.number(),
  measuredAngle: z.number().nullable(),
  deviationDegrees: z.number().nullable(),
});

export type ZeroCrossing = z.infer<typeof zeroCrossingSchema>;

export const zeroCrossingsDataSchema = z.object({
  component: z.string(), // e.g., "Bz"
  poles: z.number().int(),
  crossings: z.array(zeroCrossingSchema),
});

export type ZeroCrossingsData = z.infer<typeof zeroCrossingsDataSchema>;

// Pole center field data for multi-segment rings - field at theoretical pole centers
export const poleCenterFieldSchema = z.object({
  angle: z.number(), // Angle in degrees
  Br: z.number(), // Radial component in Tesla
  Bt: z.number(), // Tangential component in Tesla
  Bz: z.number(), // Axial component in Tesla
});

export type PoleCenterField = z.infer<typeof poleCenterFieldSchema>;

export const poleCenterFieldsDataSchema = z.object({
  poles: z.number().int(),
  fields: z.array(poleCenterFieldSchema),
});

export type PoleCenterFieldsData = z.infer<typeof poleCenterFieldsDataSchema>;

// Circle calculation response - Plotly JSON chart showing Br, Bt, Bz vs angle
export const circleCalculationResponseSchema = z.object({
  plotlyJson: z.string(), // Plotly JSON format
  zeroCrossings: zeroCrossingsDataSchema.optional(), // Optional zero crossing analysis for circle 1
  zeroCrossings2: zeroCrossingsDataSchema.optional(), // Optional zero crossing analysis for circle 2
  poleCenterFields: poleCenterFieldsDataSchema.optional(), // Optional pole center fields for circle 1
  poleCenterFields2: poleCenterFieldsDataSchema.optional(), // Optional pole center fields for circle 2
});

export type CircleCalculationResponse = z.infer<typeof circleCalculationResponseSchema>;

// Helper function to validate segment angles sum to 360 or less
export function validateSegmentAngles(segments: RingSegment[]): { valid: boolean; totalDegrees: number; lastSegmentDegrees: number } {
  if (segments.length === 0) {
    return { valid: false, totalDegrees: 0, lastSegmentDegrees: 0 };
  }
  
  // Sum all segments except the last one
  const totalExceptLast = segments.slice(0, -1).reduce((sum, seg) => sum + seg.widthDegrees, 0);
  const lastSegmentDegrees = 360 - totalExceptLast;
  const totalDegrees = totalExceptLast + segments[segments.length - 1].widthDegrees;
  
  return {
    valid: totalExceptLast <= 360 && lastSegmentDegrees > 0 && lastSegmentDegrees <= 360,
    totalDegrees,
    lastSegmentDegrees
  };
}

// Helper function to generate equal segments for a given number of poles
export function generateEqualSegments(numPoles: number): RingSegment[] {
  const segmentWidth = 360 / numPoles;
  return Array.from({ length: numPoles }, (_, i) => ({
    widthDegrees: segmentWidth,
    magnetizationMultiplier: i % 2 === 0 ? 1 : -1, // Alternate N/S
  }));
}

// Report generation schemas
// Report section types - defines which content can appear in the report
export const reportSections = [
  "point_calculation",      // Point calculation (Bx, By, Bz at a point)
  "field_visualization",    // 2D field visualization with arrows
  "line_measurement",       // Line measurement (Bx/By/Bz along line(s))
  "circle_measurement",     // Circle measurement (Br/Bt/Bz on circle(s))
  "zero_crossings",         // Zero crossing analysis (multi-segment rings only)
  "documentation"           // Technical documentation (formulas, flowcharts)
] as const;

export type ReportSection = typeof reportSections[number];

// Report inputs - stores request parameters and precomputed results for each section
export const reportInputsSchema = z.object({
  // Point calculation: request + optional result
  point: z.object({
    request: fieldCalculationRequestSchema,
    result: fieldCalculationResponseSchema.optional()
  }).optional(),
  
  // Visualization: just the request (charts generated separately)
  visualization: fieldCalculationRequestSchema.optional(),
  
  // Line measurement: requests + optional plotly charts (up to 2 lines)
  line: z.array(z.object({
    request: lineCalculationRequestSchema,
    plotlyJson: z.string().optional()
  })).max(2).optional(),
  
  // Circle measurement: requests + optional plotly charts + zero crossings (up to 2 circles)
  circle: z.array(z.object({
    request: circleCalculationRequestSchema,
    plotlyJson: z.string().optional(),
    zeroCrossings: zeroCrossingsDataSchema.optional(),
    zeroCrossings2: zeroCrossingsDataSchema.optional()
  })).max(2).optional(),
});

export type ReportInputs = z.infer<typeof reportInputsSchema>;

// Report request schema
export const reportRequestSchema = z.object({
  sections: z.array(z.enum(reportSections)).min(1),
  inputs: reportInputsSchema,
  lengthUnit: z.enum(lengthUnits),
  fieldUnit: z.enum(fieldUnits),
}).refine(
  (data) => {
    // Validate that each section has corresponding input data
    // Note: validation is relaxed - sections check if data is available during generation
    for (const section of data.sections) {
      // Point calculation needs point.request
      if (section === "point_calculation" && !data.inputs.point?.request) return false;
      // Field visualization needs visualization request
      if (section === "field_visualization" && !data.inputs.visualization) return false;
      // Line measurement needs at least one line
      if (section === "line_measurement" && (!data.inputs.line || data.inputs.line.length === 0)) return false;
      // Circle measurement needs at least one circle
      if (section === "circle_measurement" && (!data.inputs.circle || data.inputs.circle.length === 0)) return false;
      // Zero crossings needs at least one circle
      if (section === "zero_crossings" && (!data.inputs.circle || data.inputs.circle.length === 0)) return false;
      // documentation doesn't need input data
    }
    return true;
  },
  {
    message: "Each selected section must have corresponding input data",
  }
);

export type ReportRequest = z.infer<typeof reportRequestSchema>;

// Report response - PDF as base64 encoded string
export const reportResponseSchema = z.object({
  pdfBase64: z.string(),
  filename: z.string(), // Suggested filename for download
});

export type ReportResponse = z.infer<typeof reportResponseSchema>;
