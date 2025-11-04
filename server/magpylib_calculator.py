#!/usr/bin/env python3
"""
Magnetic field calculator using Magpylib for accurate near-field calculations.
Accepts JSON input via stdin and returns JSON output.
"""

import json
import sys
import magpylib as magpy
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server-side rendering
import matplotlib.pyplot as plt
import io
import base64


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


def calculate_field_grid(magnet_config):
    """
    Calculate magnetic field on a 2D grid in the X-Z plane (Y=0 cross-section).
    
    Args:
        magnet_config: Dict with keys:
            - type, magnetization, dimensions (as in calculate_field)
            - xMin, xMax, zMin, zMax: grid bounds in meters
            - gridSize: number of points per dimension
    
    Returns:
        Dict with xValues, zValues, Bx (2D array), Bz (2D array)
    """
    magnet_type = magnet_config['type']
    magnetization = magnet_config['magnetization']
    grid_size = magnet_config.get('gridSize', 30)
    
    # Grid bounds
    x_min = magnet_config['xMin']
    x_max = magnet_config['xMax']
    z_min = magnet_config['zMin']
    z_max = magnet_config['zMax']
    
    # Create magnet based on type (same as calculate_field)
    if magnet_type in ['bar', 'rectangular']:
        length = magnet_config.get('length', 0.01)
        width = magnet_config.get('width', 0.01)
        height = magnet_config.get('height', 0.01)
        magnet = magpy.magnet.Cuboid(
            polarization=(0, 0, magnetization),
            dimension=(length, width, height)
        )
    elif magnet_type == 'cylindrical':
        diameter = magnet_config.get('diameter', 0.01)
        length = magnet_config.get('length', 0.01)
        magnet = magpy.magnet.Cylinder(
            polarization=(0, 0, magnetization),
            dimension=(diameter, length)
        )
    elif magnet_type == 'ring':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        magnet = magpy.magnet.CylinderSegment(
            polarization=(0, 0, magnetization),
            dimension=(inner_diameter, outer_diameter, thickness, 0, 360)
        )
    else:
        raise ValueError(f"Unknown magnet type: {magnet_type}")
    
    # Create grid points in X-Z plane (Y=0)
    x_values = np.linspace(x_min, x_max, grid_size)
    z_values = np.linspace(z_min, z_max, grid_size)
    
    # Initialize result arrays
    Bx_grid = np.zeros((grid_size, grid_size))
    Bz_grid = np.zeros((grid_size, grid_size))
    
    # Calculate field at each grid point
    for i, z in enumerate(z_values):
        for j, x in enumerate(x_values):
            observer = np.array([x, 0, z])  # Y=0 plane
            B = magpy.getB(magnet, observer)
            Bx_grid[i, j] = float(B[0])
            Bz_grid[i, j] = float(B[2])  # Use Bz (not By)
    
    return {
        'xValues': x_values.tolist(),
        'zValues': z_values.tolist(),
        'Bx': Bx_grid.tolist(),
        'Bz': Bz_grid.tolist()
    }


def generate_field_visualization(magnet_config):
    """
    Generate field line visualization using matplotlib streamplot.
    For ring magnets: show X-Y plane (top view) to display hollow geometry.
    For other magnets: show X-Z plane (side view).
    Returns base64-encoded PNG image.
    """
    magnet_type = magnet_config['type']
    magnetization = magnet_config['magnetization']
    
    # Initialize variables
    inner_radius_m = 0
    outer_radius_m = 0
    use_xy_plane = False
    
    # Create magnet
    if magnet_type in ['bar', 'rectangular']:
        length = magnet_config.get('length', 0.01)
        width = magnet_config.get('width', 0.01)
        height = magnet_config.get('height', 0.01)
        magnet = magpy.magnet.Cuboid(
            polarization=(0, 0, magnetization),
            dimension=(length, width, height)
        )
        mag_width, mag_height = length, height
        use_xy_plane = False
    elif magnet_type == 'cylindrical':
        diameter = magnet_config.get('diameter', 0.01)
        length = magnet_config.get('length', 0.01)
        magnet = magpy.magnet.Cylinder(
            polarization=(0, 0, magnetization),
            dimension=(diameter, length)
        )
        mag_width, mag_height = diameter, length
        use_xy_plane = False
    elif magnet_type == 'ring':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        magnet = magpy.magnet.CylinderSegment(
            polarization=(0, 0, magnetization),
            dimension=(inner_diameter, outer_diameter, thickness, 0, 360)
        )
        # For ring: show side view (X-Z plane) with hollow structure visible
        mag_width, mag_height = outer_diameter, thickness
        use_xy_plane = False
        inner_radius_m = inner_diameter / 2
        outer_radius_m = outer_diameter / 2
    else:
        raise ValueError(f"Unknown magnet type: {magnet_type}")
    
    # Create grid for field calculation - all magnets use X-Z plane (Y=0, side view)
    # NOTE: mag_width and mag_height are in METERS (frontend converts dimensions to meters)
    # We work in millimeters for axis display
    padding_factor = 5.0  # Show field lines with adequate margin
    
    # Convert magnet dimensions from meters to mm for display
    mag_width_mm = mag_width * 1000
    mag_height_mm = mag_height * 1000
    x_extent_mm = mag_width_mm * padding_factor
    z_extent_mm = mag_height_mm * padding_factor
    
    grid_size = 80
    # Create grid in mm
    x_mm = np.linspace(-x_extent_mm/2, x_extent_mm/2, grid_size)
    z_mm = np.linspace(-z_extent_mm/2, z_extent_mm/2, grid_size)
    X_mm, Z_mm = np.meshgrid(x_mm, z_mm)
    
    # Convert back to meters for magpylib calculations
    X_m = X_mm / 1000
    Z_m = Z_mm / 1000
    
    # Calculate field at grid points (X-Z plane, Y=0)
    Bx = np.zeros_like(X_mm)
    Bz = np.zeros_like(Z_mm)
    B_magnitude = np.zeros_like(X_mm)
    
    for i in range(grid_size):
        for j in range(grid_size):
            observer = np.array([X_m[i, j], 0, Z_m[i, j]])
            B = magpy.getB(magnet, observer)
            Bx[i, j] = B[0]
            Bz[i, j] = B[2]
            # Calculate magnitude for color coding
            B_magnitude[i, j] = np.sqrt(B[0]**2 + B[1]**2 + B[2]**2)
    
    # Create figure
    fig, ax = plt.subplots(figsize=(8, 6), dpi=100)
    
    # Get density parameter (number of flux lines)
    num_flux_lines = magnet_config.get('numFluxLines', 15)
    # Convert to density (matplotlib uses density per plot area)
    # Higher number = more lines
    density = num_flux_lines / 10.0
    
    # Draw streamplot with color-coded field strength
    # Linear scale for direct field magnitude visualization
    # Everything is in mm now, so axes will show correct mm values
    # Use maxColorScale if provided, otherwise auto-scale
    from matplotlib.colors import Normalize
    max_color_scale = magnet_config.get('maxColorScale')
    if max_color_scale is not None and max_color_scale > 0:
        vmin, vmax = 0, max_color_scale
    else:
        vmin, vmax = 0, B_magnitude.max()
    
    stream = ax.streamplot(X_mm, Z_mm, Bx, Bz, color=B_magnitude, 
                          cmap='viridis', linewidth=1.5,
                          density=density, arrowsize=0.8, arrowstyle='->',
                          norm=Normalize(vmin=vmin, vmax=vmax))
    
    # Add colorbar with linear scale
    cbar = plt.colorbar(stream.lines, ax=ax)
    cbar.set_label('Flussdichte |B| [T]', fontsize=10)
    
    # Draw calculation point if provided (convert from m to mm)
    calc_x = magnet_config.get('calcX')
    calc_z = magnet_config.get('calcZ')
    if calc_x is not None and calc_z is not None:
        ax.plot(calc_x * 1000, calc_z * 1000, 'o', color='#22c55e', 
                markersize=8, markeredgewidth=2, markeredgecolor='white',
                label='Calculation Point', zorder=10)
    
    # Draw magnet outline (in mm) - side view (X-Z plane)
    from matplotlib.patches import Rectangle
    if magnet_type == 'ring':
        # Ring magnet in side view: show cross-section with hollow center
        outer_radius_mm = outer_radius_m * 1000
        inner_radius_mm = inner_radius_m * 1000
        rect_h = mag_height_mm
        
        # Left rectangle (outer edge to inner edge)
        left_rect = Rectangle((-outer_radius_mm, -rect_h/2), 
                             outer_radius_mm - inner_radius_mm, rect_h,
                             linewidth=2, edgecolor='#ef4444', facecolor='#ef444420', zorder=5)
        ax.add_patch(left_rect)
        
        # Right rectangle (inner edge to outer edge)
        right_rect = Rectangle((inner_radius_mm, -rect_h/2), 
                               outer_radius_mm - inner_radius_mm, rect_h,
                               linewidth=2, edgecolor='#ef4444', facecolor='#ef444420', zorder=5)
        ax.add_patch(right_rect)
        
        # White rectangle in the middle (the hollow center)
        hollow_rect = Rectangle((-inner_radius_mm, -rect_h/2), 
                               inner_radius_mm * 2, rect_h,
                               linewidth=1, edgecolor='#888888', linestyle='--',
                               facecolor='white', zorder=6)
        ax.add_patch(hollow_rect)
        
        # Add N/S labels on the sides
        ax.text(-(outer_radius_mm + inner_radius_mm)/2, rect_h/4, 'N', 
                fontsize=14, fontweight='bold', ha='center', va='center', color='#ef4444')
        ax.text(-(outer_radius_mm + inner_radius_mm)/2, -rect_h/4, 'S', 
                fontsize=14, fontweight='bold', ha='center', va='center', color='#ef4444')
    else:
        # Draw solid rectangle for other magnet types
        rect_w, rect_h = mag_width_mm, mag_height_mm
        rect = Rectangle((-rect_w/2, -rect_h/2), rect_w, rect_h,
                        linewidth=2, edgecolor='#ef4444', facecolor='#ef444420')
        ax.add_patch(rect)
        # Add N/S labels
        ax.text(0, rect_h/4, 'N', fontsize=14, fontweight='bold',
                ha='center', va='center', color='#ef4444')
        ax.text(0, -rect_h/4, 'S', fontsize=14, fontweight='bold',
                ha='center', va='center', color='#ef4444')
    
    # Set axis limits in mm
    ax.set_xlim(-x_extent_mm/2, x_extent_mm/2)
    ax.set_ylim(-z_extent_mm/2, z_extent_mm/2)
    
    # Labels - axes now directly show mm
    ax.set_xlabel('X (mm)', fontsize=10)
    ax.set_ylabel('Z (mm)', fontsize=10)
    ax.set_title('Magnetfeld-Linien (X-Z Ebene, Seitenansicht)', fontsize=12, fontweight='bold')
    
    ax.set_aspect('equal')
    ax.grid(True, alpha=0.2)
    
    # Convert plot to base64-encoded PNG
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    plt.close(fig)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    
    return {'image': img_base64}


def main():
    """Main entry point - read JSON from stdin, calculate, output JSON."""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Check mode
        mode = input_data.get('mode')
        if mode == 'grid':
            result = calculate_field_grid(input_data)
        elif mode == 'visualization':
            result = generate_field_visualization(input_data)
        else:
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
