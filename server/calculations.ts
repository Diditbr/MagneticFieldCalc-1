import type {
  FieldCalculationRequest,
  FieldCalculationResponse,
  MagnetType,
} from "@shared/schema";

const MU_0 = 4 * Math.PI * 1e-7; // Permeability of free space (T·m/A)

/**
 * Calculate the volume of a magnet based on its type and dimensions
 */
function calculateVolume(type: MagnetType, request: FieldCalculationRequest): number {
  switch (type) {
    case "bar":
    case "rectangular":
      return (request.length || 0) * (request.width || 0) * (request.height || 0);
    
    case "cylindrical":
      const radius = (request.diameter || 0) / 2;
      return Math.PI * radius * radius * (request.length || 0);
    
    case "ring":
      const outerRadius = (request.diameter || 0) / 2;
      const innerRadius = (request.innerDiameter || 0) / 2;
      const area = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);
      return area * (request.thickness || 0);
    
    default:
      return 0;
  }
}

/**
 * Calculate magnetic field using the magnetic dipole approximation
 * 
 * This is valid for distances r >> magnet size
 * B(r) = (μ₀/4π) × (3(m·r̂)r̂ - m) / r³
 * 
 * For a magnet magnetized along the z-axis:
 * m = M × V × ẑ (where M is magnetization in A/m, V is volume)
 * 
 * Note: Input magnetization is in Tesla (Br - remanent field)
 * We convert to magnetization M using: M = Br / μ₀
 */
export function calculateMagneticField(
  request: FieldCalculationRequest
): FieldCalculationResponse {
  const { x, y, z, magnetization, type } = request;
  
  // Convert magnetization from Tesla (Br) to A/m (M)
  // M = Br / μ₀
  const magnetizationAm = magnetization / MU_0; // A/m
  
  // Calculate the magnetic moment (assuming magnetization along z-axis)
  const volume = calculateVolume(type, request);
  const magneticMoment = magnetizationAm * volume; // A·m²
  
  // Position vector from magnet center
  const r = Math.sqrt(x * x + y * y + z * z);
  
  // Avoid division by zero
  if (r < 1e-10) {
    return {
      Bx: 0,
      By: 0,
      Bz: 0,
      magnitude: 0,
      distance: 0,
    };
  }
  
  // Unit vector
  const rx = x / r;
  const ry = y / r;
  const rz = z / r;
  
  // Magnetic moment vector (along z-axis)
  const mx = 0;
  const my = 0;
  const mz = magneticMoment;
  
  // m · r̂ (dot product)
  const mDotR = mx * rx + my * ry + mz * rz;
  
  // Dipole field formula: B = (μ₀/4π) × (3(m·r̂)r̂ - m) / r³
  const coefficient = (MU_0 / (4 * Math.PI)) / (r * r * r);
  
  const Bx = coefficient * (3 * mDotR * rx - mx);
  const By = coefficient * (3 * mDotR * ry - my);
  const Bz = coefficient * (3 * mDotR * rz - mz);
  
  const magnitude = Math.sqrt(Bx * Bx + By * By + Bz * Bz);
  
  return {
    Bx,
    By,
    Bz,
    magnitude,
    distance: r,
  };
}

/**
 * Calculate magnetic field using more precise methods for cylindrical magnets
 * on the axis of symmetry
 * 
 * @param magnetization - Remanent field in Tesla (Br)
 */
export function calculateCylindricalAxisField(
  magnetization: number,
  radius: number,
  length: number,
  z: number
): number {
  // Convert magnetization from Tesla (Br) to A/m (M)
  const magnetizationAm = magnetization / MU_0;
  
  // On-axis field for a cylindrical magnet
  // Bz = (μ₀ × M/2) × [(z+L/2)/√((z+L/2)² + R²) - (z-L/2)/√((z-L/2)² + R²)]
  
  const zPlus = z + length / 2;
  const zMinus = z - length / 2;
  
  const term1 = zPlus / Math.sqrt(zPlus * zPlus + radius * radius);
  const term2 = zMinus / Math.sqrt(zMinus * zMinus + radius * radius);
  
  return (MU_0 * magnetizationAm / 2) * (term1 - term2);
}

/**
 * Enhanced calculation that uses analytical solutions when available
 */
export function calculateFieldEnhanced(
  request: FieldCalculationRequest
): FieldCalculationResponse {
  const { x, y, z, type } = request;
  
  // For cylindrical magnets on the z-axis, use the analytical solution
  if (type === "cylindrical" && Math.abs(x) < 1e-10 && Math.abs(y) < 1e-10) {
    const radius = (request.diameter || 0) / 2;
    const length = request.length || 0;
    const Bz = calculateCylindricalAxisField(request.magnetization, radius, length, z);
    
    return {
      Bx: 0,
      By: 0,
      Bz,
      magnitude: Math.abs(Bz),
      distance: Math.abs(z),
    };
  }
  
  // For all other cases, use dipole approximation
  return calculateMagneticField(request);
}
