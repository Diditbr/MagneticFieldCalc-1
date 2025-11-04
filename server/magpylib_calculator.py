#!/usr/bin/env python3
"""
Magnetic field calculator using Magpylib for accurate near-field calculations.
Accepts JSON input via stdin and returns JSON output.
"""

import json
import sys
import math
import magpylib as magpy
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server-side rendering
import matplotlib.pyplot as plt
import io
import base64


def get_polarization_vector(magnetization, magnetization_type='axial', angle_deg=0):
    """
    Calculate polarization vector based on magnetization type and angle.
    
    Args:
        magnetization: Magnetization strength in Tesla
        magnetization_type: 'axial' or 'diametral'
        angle_deg: Angle in degrees (0-360) for diametral magnetization
    
    Returns:
        Tuple (px, py, pz) polarization vector
    """
    if magnetization_type == 'axial':
        # Axial: magnetization along Z-axis
        return (0, 0, magnetization)
    elif magnetization_type == 'diametral':
        # Diametral: magnetization in X-Z plane at specified angle
        # This way both components are visible in the X-Z visualization plane
        angle_rad = math.radians(angle_deg)
        px = magnetization * math.cos(angle_rad)
        pz = magnetization * math.sin(angle_rad)
        return (px, 0, pz)
    else:
        raise ValueError(f"Unknown magnetization type: {magnetization_type}")


def calculate_field(magnet_config):
    """
    Calculate magnetic field using Magpylib.
    
    Args:
        magnet_config: Dict with keys:
            - type: str ('bar', 'cylindrical', 'rectangular', 'ring')
            - magnetization: float (Tesla)
            - dimensions in meters
            - observer position (x, y, z) in meters
              NOTE: z=0 is at the magnet surface (top pole face) in UI coordinates
    
    Returns:
        Dict with Bx, By, Bz, magnitude, distance
    """
    magnet_type = magnet_config['type']
    magnetization = magnet_config['magnetization']
    magnetization_type = magnet_config.get('magnetizationType', 'axial')
    magnetization_angle = magnet_config.get('magnetizationAngle', 0)
    x_ui = magnet_config['x']
    y_ui = magnet_config['y']
    z_ui = magnet_config['z']
    
    # Determine magnet height (dimension along z-axis) for coordinate transformation
    if magnet_type in ['bar', 'rectangular']:
        magnet_height = magnet_config.get('height', 0.01)
    elif magnet_type == 'cylindrical':
        magnet_height = magnet_config.get('length', 0.01)
    elif magnet_type == 'ring':
        magnet_height = magnet_config.get('thickness', 0.01)
    else:
        magnet_height = 0.01
    
    # Transform coordinates: UI has z=0 at surface, Magpylib has z=0 at center
    # z_magpylib = z_ui + height/2
    z_magpylib = z_ui + magnet_height / 2
    
    # Observer position in Magpylib coordinates
    observer = np.array([x_ui, y_ui, z_magpylib])
    
    # Create magnet based on type
    if magnet_type in ['bar', 'rectangular']:
        # Create cuboid magnet (always axially magnetized)
        length = magnet_config.get('length', 0.01)
        width = magnet_config.get('width', 0.01)
        height = magnet_config.get('height', 0.01)
        
        magnet = magpy.magnet.Cuboid(
            polarization=(0, 0, magnetization),  # Always axial for cuboids
            dimension=(length, width, height)
        )
    
    elif magnet_type == 'cylindrical':
        # Create cylindrical magnet (supports axial and diametral)
        diameter = magnet_config.get('diameter', 0.01)
        length = magnet_config.get('length', 0.01)
        
        polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
        magnet = magpy.magnet.Cylinder(
            polarization=polarization,
            dimension=(diameter, length)
        )
    
    elif magnet_type == 'ring':
        # Create ring magnet using CylinderSegment (supports axial and diametral)
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        
        polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
        
        # CRITICAL: CylinderSegment has INVERTED polarization for axial
        # Only invert Z-component for axial magnetization
        if magnetization_type == 'axial':
            polarization = (polarization[0], polarization[1], -polarization[2])
        
        magnet = magpy.magnet.CylinderSegment(
            polarization=polarization,
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
        # CylinderSegment has inverted polarization - use negative for Nord at top
        magnet = magpy.magnet.CylinderSegment(
            polarization=(0, 0, -magnetization),
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
    magnetization_type = magnet_config.get('magnetizationType', 'axial')
    magnetization_angle = magnet_config.get('magnetizationAngle', 0)
    
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
            polarization=(0, 0, magnetization),  # Always axial for cuboids
            dimension=(length, width, height)
        )
        mag_width, mag_height = length, height
        use_xy_plane = False
    elif magnet_type == 'cylindrical':
        diameter = magnet_config.get('diameter', 0.01)
        length = magnet_config.get('length', 0.01)
        
        polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
        magnet = magpy.magnet.Cylinder(
            polarization=polarization,
            dimension=(diameter, length)
        )
        mag_width, mag_height = diameter, length
        use_xy_plane = False
    elif magnet_type == 'ring':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        
        polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
        
        # CRITICAL: CylinderSegment has INVERTED polarization for axial
        # Only invert Z-component for axial magnetization
        if magnetization_type == 'axial':
            polarization = (polarization[0], polarization[1], -polarization[2])
        
        magnet = magpy.magnet.CylinderSegment(
            polarization=polarization,
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
    
    # Use smaller grid for ring magnets to speed up computation
    grid_size = 60 if magnet_type == 'ring' else 80
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
    # NOTE: UI coordinates have z=0 at surface, Magpylib has z=0 at center
    # We draw in Magpylib coordinates and adjust axis labels later
    calc_x_ui = magnet_config.get('calcX')
    calc_z_ui = magnet_config.get('calcZ')
    if calc_x_ui is not None and calc_z_ui is not None:
        # Transform z coordinate: UI has z=0 at surface, Magpylib has z=0 at center
        calc_z_magpylib = calc_z_ui + mag_height / 2
        ax.plot(calc_x_ui * 1000, calc_z_magpylib * 1000, 'o', color='#22c55e', 
                markersize=8, markeredgewidth=2, markeredgecolor='white',
                label='Berechnungspunkt', zorder=10)
    
    # Draw line if provided (convert from m to mm)
    # NOTE: UI coordinates have z=0 at surface, Magpylib has z=0 at center
    # We draw in Magpylib coordinates and adjust axis labels later
    line_start_x_ui = magnet_config.get('lineStartX')
    line_start_z_ui = magnet_config.get('lineStartZ')
    line_end_x_ui = magnet_config.get('lineEndX')
    line_end_z_ui = magnet_config.get('lineEndZ')
    if all(v is not None for v in [line_start_x_ui, line_start_z_ui, line_end_x_ui, line_end_z_ui]):
        # Transform z coordinates: UI has z=0 at surface, Magpylib has z=0 at center
        line_start_z_magpylib = line_start_z_ui + mag_height / 2
        line_end_z_magpylib = line_end_z_ui + mag_height / 2
        # Convert from meters to mm
        line_x_mm = [line_start_x_ui * 1000, line_end_x_ui * 1000]
        line_z_mm = [line_start_z_magpylib * 1000, line_end_z_magpylib * 1000]
        ax.plot(line_x_mm, line_z_mm, 'o-', color='#3b82f6', 
                linewidth=2.5, markersize=6, markeredgewidth=1.5, markeredgecolor='white',
                label='Messlinie', zorder=11)
    
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
        
        # Add N/S labels - axial magnetization means N at top surface, S at bottom surface
        # Left side labels
        ax.text(-(outer_radius_mm + inner_radius_mm)/2, rect_h/2 + rect_h*0.15, 'N', 
                fontsize=14, fontweight='bold', ha='center', va='center', color='#ef4444')
        ax.text(-(outer_radius_mm + inner_radius_mm)/2, -rect_h/2 - rect_h*0.15, 'S', 
                fontsize=14, fontweight='bold', ha='center', va='center', color='#ef4444')
        # Right side labels
        ax.text((outer_radius_mm + inner_radius_mm)/2, rect_h/2 + rect_h*0.15, 'N', 
                fontsize=14, fontweight='bold', ha='center', va='center', color='#ef4444')
        ax.text((outer_radius_mm + inner_radius_mm)/2, -rect_h/2 - rect_h*0.15, 'S', 
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
    
    # Set axis limits in mm (in Magpylib coordinates: z=0 at center)
    ax.set_xlim(-x_extent_mm/2, x_extent_mm/2)
    ax.set_ylim(-z_extent_mm/2, z_extent_mm/2)
    
    # Transform Y-axis labels to UI coordinates (z=0 at surface)
    # In Magpylib: z=0 at center, surface at z=+mag_height/2
    # In UI: z=0 at surface
    # Transformation: z_ui = z_magpylib - mag_height_mm/2
    # We want to ensure 0 is always shown and ticks are symmetric
    from matplotlib.ticker import MultipleLocator
    
    # Calculate appropriate tick spacing in Magpylib coordinates
    # The surface is at mag_height_mm/2, so we want ticks centered there in UI coords (which is 0)
    z_range = z_extent_mm
    # Determine a nice tick spacing (roughly 5-8 ticks)
    tick_spacing = 2 ** round(np.log2(z_range / 6))  # Power of 2 for nice numbers
    if tick_spacing < 1:
        tick_spacing = 1
    
    # Set ticks in Magpylib coordinates, centered at mag_height_mm/2 (which is UI z=0)
    surface_z_magpylib = mag_height_mm / 2
    # Find the range of ticks needed
    min_tick = np.floor((-z_extent_mm/2 - surface_z_magpylib) / tick_spacing) * tick_spacing
    max_tick = np.ceil((z_extent_mm/2 - surface_z_magpylib) / tick_spacing) * tick_spacing
    # Generate ticks in UI coordinates
    ui_ticks = np.arange(min_tick, max_tick + tick_spacing/2, tick_spacing)
    # Convert to Magpylib coordinates for positioning
    magpylib_ticks = ui_ticks + surface_z_magpylib
    
    ax.set_yticks(magpylib_ticks)
    ax.set_yticklabels([f'{int(tick)}' for tick in ui_ticks])
    
    # Labels
    ax.set_xlabel('X (mm)', fontsize=10)
    ax.set_ylabel('Z (mm)', fontsize=10)
    ax.set_title('Magnetfeld-Linien (X-Z Ebene, Seitenansicht)', fontsize=12, fontweight='bold')
    
    # Add legend if there are labeled items
    handles, labels = ax.get_legend_handles_labels()
    if handles:
        ax.legend(loc='upper right', fontsize=9, framealpha=0.9)
    
    ax.set_aspect('equal')
    ax.grid(True, alpha=0.2)
    
    # Convert plot to base64-encoded PNG
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    plt.close(fig)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    
    return {'image': img_base64}


def calculate_line_field(magnet_config):
    """
    Calculate magnetic field along a line in 3D space and generate a chart.
    
    Args:
        magnet_config: Dict with keys:
            - type, magnetization, dimensions (as in calculate_field)
            - startX, startY, startZ: line start point in meters (UI coordinates: z=0 at surface)
            - endX, endY, endZ: line end point in meters (UI coordinates: z=0 at surface)
            - numPoints: number of points along the line (default: 100)
    
    Returns:
        Dict with base64-encoded PNG image of the chart
    """
    magnet_type = magnet_config['type']
    magnetization = magnet_config['magnetization']
    magnetization_type = magnet_config.get('magnetizationType', 'axial')
    magnetization_angle = magnet_config.get('magnetizationAngle', 0)
    
    # Determine magnet height for coordinate transformation
    if magnet_type in ['bar', 'rectangular']:
        magnet_height = magnet_config.get('height', 0.01)
    elif magnet_type == 'cylindrical':
        magnet_height = magnet_config.get('length', 0.01)
    elif magnet_type == 'ring':
        magnet_height = magnet_config.get('thickness', 0.01)
    else:
        magnet_height = 0.01
    
    # Line parameters (in UI coordinates)
    start_ui = np.array([
        magnet_config['startX'],
        magnet_config['startY'],
        magnet_config['startZ']
    ])
    end_ui = np.array([
        magnet_config['endX'],
        magnet_config['endY'],
        magnet_config['endZ']
    ])
    
    # Transform z coordinates: UI has z=0 at surface, Magpylib has z=0 at center
    start_magpylib = start_ui.copy()
    start_magpylib[2] += magnet_height / 2
    end_magpylib = end_ui.copy()
    end_magpylib[2] += magnet_height / 2
    
    num_points = magnet_config.get('numPoints', 100)
    
    # Create magnet based on type (same as calculate_field)
    if magnet_type in ['bar', 'rectangular']:
        length = magnet_config.get('length', 0.01)
        width = magnet_config.get('width', 0.01)
        height = magnet_config.get('height', 0.01)
        magnet = magpy.magnet.Cuboid(
            polarization=(0, 0, magnetization),  # Always axial for cuboids
            dimension=(length, width, height)
        )
    elif magnet_type == 'cylindrical':
        diameter = magnet_config.get('diameter', 0.01)
        length = magnet_config.get('length', 0.01)
        polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
        magnet = magpy.magnet.Cylinder(
            polarization=polarization,
            dimension=(diameter, length)
        )
    elif magnet_type == 'ring':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
        if magnetization_type == 'axial':
            polarization = (polarization[0], polarization[1], -polarization[2])
        magnet = magpy.magnet.CylinderSegment(
            polarization=polarization,
            dimension=(inner_diameter, outer_diameter, thickness, 0, 360)
        )
    else:
        raise ValueError(f"Unknown magnet type: {magnet_type}")
    
    # Generate points along the line (in Magpylib coordinates)
    line_points = np.linspace(start_magpylib, end_magpylib, num_points)
    
    # Calculate B field at each point
    Bx_values = []
    By_values = []
    Bz_values = []
    distances = []  # Distance from start point along the line
    
    for point in line_points:
        B = magpy.getB(magnet, point)
        Bx_values.append(float(B[0]))
        By_values.append(float(B[1]))
        Bz_values.append(float(B[2]))
        # Calculate distance from start along the line (in mm for display)
        # Use UI coordinates for distance calculation so it matches user expectations
        distances.append(float(np.linalg.norm(point - start_magpylib) * 1000))
    
    # Create matplotlib chart
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Plot three lines for Bx, By, Bz
    ax.plot(distances, [b * 1000 for b in Bx_values], 'r-', linewidth=2, label='Bx')
    ax.plot(distances, [b * 1000 for b in By_values], 'g-', linewidth=2, label='By')
    ax.plot(distances, [b * 1000 for b in Bz_values], 'b-', linewidth=2, label='Bz')
    
    # Add grid and labels
    ax.grid(True, alpha=0.3)
    ax.set_xlabel('Distanz entlang Linie (mm)', fontsize=12)
    ax.set_ylabel('Magnetische Flussdichte (mT)', fontsize=12)
    ax.set_title('Feldkomponenten entlang der Linie', fontsize=14, fontweight='bold')
    ax.legend(loc='best', fontsize=10)
    
    # Add zero line
    ax.axhline(y=0, color='k', linestyle='--', alpha=0.3, linewidth=0.8)
    
    plt.tight_layout()
    
    # Convert plot to base64 PNG
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    
    return {
        'image': img_base64
    }


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
        elif mode == 'line':
            result = calculate_line_field(input_data)
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
