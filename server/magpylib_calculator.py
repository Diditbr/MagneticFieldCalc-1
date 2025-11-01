#!/usr/bin/env python3
"""
Magnetic field calculator using Magpylib for accurate near-field calculations.
Accepts JSON input via stdin and returns JSON output.
"""

import json
import sys
import magpylib as magpy
import numpy as np


def calculate_field(magnet_config):
    """
    Calculate magnetic field using Magpylib.
    
    Args:
        magnet_config: Dict with keys:
            - type: str ('bar', 'cylindrical', 'rectangular', 'ring')
            - magnetization: float (Tesla)
            - dimensions in meters
            - observer position (x, y, z) in meters
    
    Returns:
        Dict with Bx, By, Bz, magnitude, distance
    """
    magnet_type = magnet_config['type']
    magnetization = magnet_config['magnetization']
    x = magnet_config['x']
    y = magnet_config['y']
    z = magnet_config['z']
    
    # Observer position
    observer = np.array([x, y, z])
    
    # Create magnet based on type
    if magnet_type in ['bar', 'rectangular']:
        # Create cuboid magnet (magnetized along z-axis)
        length = magnet_config.get('length', 0.01)
        width = magnet_config.get('width', 0.01)
        height = magnet_config.get('height', 0.01)
        
        magnet = magpy.magnet.Cuboid(
            polarization=(0, 0, magnetization),  # Magnetized along z-axis
            dimension=(length, width, height)
        )
    
    elif magnet_type == 'cylindrical':
        # Create cylindrical magnet (magnetized along z-axis / height direction)
        diameter = magnet_config.get('diameter', 0.01)
        length = magnet_config.get('length', 0.01)
        radius = diameter / 2
        
        magnet = magpy.magnet.Cylinder(
            polarization=(0, 0, magnetization),
            dimension=(diameter, length)
        )
    
    elif magnet_type == 'ring':
        # Create ring magnet using CylinderSegment with full 360° angle
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        
        magnet = magpy.magnet.CylinderSegment(
            polarization=(0, 0, magnetization),
            dimension=(inner_diameter, outer_diameter, thickness, 0, 360)
        )
    
    else:
        raise ValueError(f"Unknown magnet type: {magnet_type}")
    
    # Calculate B-field at observer position
    B = magpy.getB(magnet, observer)
    
    # Extract components
    Bx, By, Bz = float(B[0]), float(B[1]), float(B[2])
    magnitude = float(np.linalg.norm(B))
    distance = float(np.linalg.norm(observer))
    
    return {
        'Bx': Bx,
        'By': By,
        'Bz': Bz,
        'magnitude': magnitude,
        'distance': distance
    }


def main():
    """Main entry point - read JSON from stdin, calculate, output JSON."""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Calculate field
        result = calculate_field(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        # Output error as JSON
        error_result = {
            'error': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
