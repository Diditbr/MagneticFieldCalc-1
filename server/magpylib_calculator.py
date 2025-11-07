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
import plotly.graph_objects as go


def create_multi_segment_ring(magnet_config):
    """
    Create a multi-segment ring magnet with alternating magnetization.
    
    Args:
        magnet_config: Dict with keys:
            - diameter, innerDiameter, thickness: Ring dimensions in meters
            - magnetization: Base magnetization strength in Tesla
            - magnetizationType: Type of magnetization for each segment
            - magnetizationAngle: Angle for diametral magnetization
            - numPoles: Number of poles (if segments not provided)
            - segments: Optional list of segment definitions with widthDegrees and magnetizationMultiplier
    
    Returns:
        magpy.Collection of CylinderSegment magnets
    """
    outer_diameter = magnet_config.get('diameter', 0.01)
    inner_diameter = magnet_config.get('innerDiameter', 0.005)
    thickness = magnet_config.get('thickness', 0.01)
    magnetization = magnet_config['magnetization']
    magnetization_type = magnet_config.get('magnetizationType', 'axial')
    magnetization_angle = magnet_config.get('magnetizationAngle', 0)
    
    # Generate or use provided segments
    segments = magnet_config.get('segments')
    if not segments:
        # Generate equal segments based on numPoles
        num_poles = magnet_config.get('numPoles', 4)
        segment_width = 360 / num_poles
        segments = [{'widthDegrees': segment_width, 'magnetizationMultiplier': 1 if i % 2 == 0 else -1} 
                   for i in range(num_poles)]
    
    # Create magnet collection
    magnets = []
    current_angle = 0
    
    for i, segment in enumerate(segments):
        phi1 = current_angle
        phi2 = current_angle + segment['widthDegrees']
        
        # Get magnetization multiplier (default to alternating if not specified)
        mag_mult = segment.get('magnetizationMultiplier')
        if mag_mult is None:
            mag_mult = 1 if i % 2 == 0 else -1
        
        # Calculate polarization with multiplier
        if magnetization_type == 'radial':
            # Radial magnetization: discretize segment into sub-segments
            angle_span = phi2 - phi1
            num_subsegments = max(4, int(angle_span / 15))
            subsegment_angle = angle_span / num_subsegments
            
            for j in range(num_subsegments):
                sub_phi1 = phi1 + j * subsegment_angle
                sub_phi2 = phi1 + (j + 1) * subsegment_angle
                mid_angle = (sub_phi1 + sub_phi2) / 2
                mid_angle_rad = math.radians(mid_angle)
                
                # Polarization pointing radially (with alternating sign)
                px = magnetization * mag_mult * math.cos(mid_angle_rad)
                py = magnetization * mag_mult * math.sin(mid_angle_rad)
                
                sub_magnet = magpy.magnet.CylinderSegment(
                    polarization=(px, py, 0),
                    dimension=(inner_diameter/2, outer_diameter/2, thickness, sub_phi1, sub_phi2)
                )
                magnets.append(sub_magnet)
        else:
            # Axial or Diametral magnetization
            polarization = get_polarization_vector(magnetization * mag_mult, magnetization_type, magnetization_angle)
            
            # CRITICAL: CylinderSegment has INVERTED polarization for axial
            if magnetization_type == 'axial':
                polarization = (polarization[0], polarization[1], -polarization[2])
            
            magnet_segment = magpy.magnet.CylinderSegment(
                polarization=polarization,
                dimension=(inner_diameter/2, outer_diameter/2, thickness, phi1, phi2)
            )
            magnets.append(magnet_segment)
        
        current_angle = phi2
    
    return magpy.Collection(*magnets)


def get_polarization_vector(magnetization, magnetization_type='axial', angle_deg=0):
    """
    Calculate polarization vector based on magnetization type and angle.
    
    Args:
        magnetization: Magnetization strength in Tesla
        magnetization_type: 'axial', 'diametral', or 'radial'
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
    elif magnetization_type == 'radial':
        # Radial: magnetization in radial direction (perpendicular to axis)
        # For CylinderSegment, this is handled differently - return marker value
        # Actual radial polarization must be set in Magpylib using special methods
        return (magnetization, 0, 0)  # Marker: radial in X-Y plane
    else:
        raise ValueError(f"Unknown magnetization type: {magnetization_type}")


def calculate_field(magnet_config):
    """
    Calculate magnetic field using Magpylib.
    
    Args:
        magnet_config: Dict with keys:
            - type: str ('cylindrical', 'rectangular', 'ring')
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
    if magnet_type == 'rectangular':
        magnet_height = magnet_config.get('height', 0.01)
    elif magnet_type == 'cylindrical':
        magnet_height = magnet_config.get('length', 0.01)
    elif magnet_type == 'ring' or magnet_type == 'ring_segment':
        magnet_height = magnet_config.get('thickness', 0.01)
    else:
        magnet_height = 0.01
    
    # Transform coordinates: UI has z=0 at surface, Magpylib has z=0 at center
    # z_magpylib = z_ui + height/2
    z_magpylib = z_ui + magnet_height / 2
    
    # Observer position in Magpylib coordinates
    observer = np.array([x_ui, y_ui, z_magpylib])
    
    # Create magnet based on type
    if magnet_type == 'rectangular':
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
        
        # CylinderSegment expects RADII not DIAMETERS!
        magnet = magpy.magnet.CylinderSegment(
            polarization=polarization,
            dimension=(inner_diameter/2, outer_diameter/2, thickness, 0, 360)
        )
    
    elif magnet_type == 'ring_segment':
        # Create ring segment using CylinderSegment (supports axial, diametral, radial)
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        phi1 = magnet_config.get('phi1', 0)
        phi2 = magnet_config.get('phi2', 90)
        
        if magnetization_type == 'radial':
            # Radial magnetization: discretize segment into sub-segments
            # Each sub-segment has polarization pointing radially outward at its mid-angle
            angle_span = phi2 - phi1
            num_segments = max(4, int(angle_span / 15))  # At least 4 segments, or one per 15 degrees
            segment_angle = angle_span / num_segments
            
            # Create collection of sub-segments
            magnets = []
            for i in range(num_segments):
                sub_phi1 = phi1 + i * segment_angle
                sub_phi2 = phi1 + (i + 1) * segment_angle
                mid_angle = (sub_phi1 + sub_phi2) / 2
                mid_angle_rad = math.radians(mid_angle)
                
                # Polarization pointing radially outward at this sub-segment's mid-angle
                px = magnetization * math.cos(mid_angle_rad)
                py = magnetization * math.sin(mid_angle_rad)
                
                # CylinderSegment expects RADII not DIAMETERS!
                sub_magnet = magpy.magnet.CylinderSegment(
                    polarization=(px, py, 0),
                    dimension=(inner_diameter/2, outer_diameter/2, thickness, sub_phi1, sub_phi2)
                )
                magnets.append(sub_magnet)
            
            # Create magnet collection
            magnet = magpy.Collection(*magnets)
        else:
            # Axial or Diametral magnetization
            polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
            
            # CRITICAL: CylinderSegment has INVERTED polarization for axial
            if magnetization_type == 'axial':
                polarization = (polarization[0], polarization[1], -polarization[2])
            
            # CylinderSegment expects RADII not DIAMETERS!
            magnet = magpy.magnet.CylinderSegment(
                polarization=polarization,
                dimension=(inner_diameter/2, outer_diameter/2, thickness, phi1, phi2)
            )
    
    elif magnet_type == 'ring_multi_segment':
        # Create multi-segment ring with alternating magnetization
        magnet = create_multi_segment_ring(magnet_config)
    
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
    if magnet_type == 'rectangular':
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
        # CylinderSegment expects RADII not DIAMETERS!
        magnet = magpy.magnet.CylinderSegment(
            polarization=(0, 0, -magnetization),
            dimension=(inner_diameter/2, outer_diameter/2, thickness, 0, 360)
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
    Generate interactive field visualization using Plotly.
    Automatically selects view plane:
    - X-Y plane (top view) for radial/diametral magnetization on ring/ring_segment
    - X-Z plane (side view) for axial magnetization and all other cases
    Returns Plotly JSON for frontend rendering.
    """
    magnet_type = magnet_config['type']
    magnetization = magnet_config['magnetization']
    magnetization_type = magnet_config.get('magnetizationType', 'axial')
    magnetization_angle = magnet_config.get('magnetizationAngle', 0)
    
    # Determine view plane
    # X-Y plane (top view) for radial/diametral magnetization to show radial field pattern
    # X-Z plane (side view) for axial magnetization and rectangular magnets
    use_xy_plane = (magnet_type in ['ring', 'ring_segment', 'cylindrical']) and (magnetization_type in ['radial', 'diametral'])
    
    # Create magnet (reuse logic from calculate_field)
    if magnet_type == 'rectangular':
        length = magnet_config.get('length', 0.01)
        width = magnet_config.get('width', 0.01)
        height = magnet_config.get('height', 0.01)
        magnet = magpy.magnet.Cuboid(
            polarization=(0, 0, magnetization),
            dimension=(length, width, height)
        )
        mag_length, mag_width, mag_height = length, width, height
        inner_r, outer_r = 0, 0
        phi1, phi2 = 0, 360
    elif magnet_type == 'cylindrical':
        diameter = magnet_config.get('diameter', 0.01)
        length = magnet_config.get('length', 0.01)
        polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
        magnet = magpy.magnet.Cylinder(
            polarization=polarization,
            dimension=(diameter, length)
        )
        mag_length, mag_width, mag_height = diameter, diameter, length
        inner_r, outer_r = 0, 0
        phi1, phi2 = 0, 360
    elif magnet_type == 'ring':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
        if magnetization_type == 'axial':
            polarization = (polarization[0], polarization[1], -polarization[2])
        # CylinderSegment expects RADII not DIAMETERS!
        magnet = magpy.magnet.CylinderSegment(
            polarization=polarization,
            dimension=(inner_diameter/2, outer_diameter/2, thickness, 0, 360)
        )
        mag_length, mag_width, mag_height = outer_diameter, outer_diameter, thickness
        inner_r, outer_r = inner_diameter / 2, outer_diameter / 2
        phi1, phi2 = 0, 360
    elif magnet_type == 'ring_segment':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        phi1 = magnet_config.get('phi1', 0)
        phi2 = magnet_config.get('phi2', 90)
        
        if magnetization_type == 'radial':
            angle_span = phi2 - phi1
            num_segments = max(4, int(angle_span / 15))
            segment_angle = angle_span / num_segments
            magnets = []
            for i in range(num_segments):
                sub_phi1 = phi1 + i * segment_angle
                sub_phi2 = phi1 + (i + 1) * segment_angle
                mid_angle = (sub_phi1 + sub_phi2) / 2
                mid_angle_rad = math.radians(mid_angle)
                px = magnetization * math.cos(mid_angle_rad)
                py = magnetization * math.sin(mid_angle_rad)
                # CylinderSegment expects RADII not DIAMETERS!
                sub_magnet = magpy.magnet.CylinderSegment(
                    polarization=(px, py, 0),
                    dimension=(inner_diameter/2, outer_diameter/2, thickness, sub_phi1, sub_phi2)
                )
                magnets.append(sub_magnet)
            magnet = magpy.Collection(*magnets)
        else:
            polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
            if magnetization_type == 'axial':
                polarization = (polarization[0], polarization[1], -polarization[2])
            # CylinderSegment expects RADII not DIAMETERS!
            magnet = magpy.magnet.CylinderSegment(
                polarization=polarization,
                dimension=(inner_diameter/2, outer_diameter/2, thickness, phi1, phi2)
            )
        
        mag_length, mag_width, mag_height = outer_diameter, outer_diameter, thickness
        inner_r, outer_r = inner_diameter / 2, outer_diameter / 2
    else:
        raise ValueError(f"Unknown magnet type: {magnet_type}")
    
    # Grid setup - high resolution for best quality
    # Padding factor of 3.3 means magnet fills ~30% of display area (1/3.3 ≈ 0.30)
    padding_factor = 3.3
    grid_size = 70 if magnet_type == 'ring_segment' else (75 if magnet_type == 'ring' else 80)
    
    # Convert to mm
    mag_length_mm = mag_length * 1000
    mag_width_mm = mag_width * 1000
    mag_height_mm = mag_height * 1000
    inner_r_mm = inner_r * 1000
    outer_r_mm = outer_r * 1000
    
    if use_xy_plane:
        # X-Y plane (Z=0, top view)
        x_extent_mm = max(mag_length_mm, mag_width_mm) * padding_factor
        y_extent_mm = max(mag_length_mm, mag_width_mm) * padding_factor
        x_mm = np.linspace(-x_extent_mm/2, x_extent_mm/2, grid_size)
        y_mm = np.linspace(-y_extent_mm/2, y_extent_mm/2, grid_size)
        X_mm, Y_mm = np.meshgrid(x_mm, y_mm)
        X_m, Y_m = X_mm / 1000, Y_mm / 1000
        
        # Vectorized field calculation
        observers = np.stack([X_m.flatten(), Y_m.flatten(), np.zeros(grid_size * grid_size)], axis=-1)
        B = magpy.getB(magnet, observers)
        Bx = B[:, 0].reshape(grid_size, grid_size)
        By = B[:, 1].reshape(grid_size, grid_size)
        Bz = B[:, 2].reshape(grid_size, grid_size)
        B_mag = np.sqrt(Bx**2 + By**2 + Bz**2)
        
        # Create Plotly figure
        fig = go.Figure()
        
        # Add field magnitude as contour/heatmap
        max_color = magnet_config.get('maxColorScale')
        heatmap_params = {
            'x': x_mm,
            'y': y_mm,
            'z': B_mag,
            'colorscale': 'Jet',
            'colorbar': dict(title="Flussdichte |B| [T]", tickformat='.4f'),
            'hovertemplate': 'X: %{x:.2f} mm<br>Y: %{y:.2f} mm<br>|B|: %{z:.4f} T<extra></extra>',
            'zauto': True
        }
        if max_color and max_color > 0:
            heatmap_params['zmin'] = 0
            heatmap_params['zmax'] = max_color
        
        fig.add_trace(go.Heatmap(**heatmap_params))
        
        # Add vector field arrows - controlled by numFluxLines parameter
        num_flux_lines = magnet_config.get('numFluxLines', 8)
        # Calculate skip to get approximately the requested number of arrows
        # Limit to 1600 arrows (40x40) to prevent timeout - Plotly annotations are slow!
        target_arrows = max(4, min(num_flux_lines * num_flux_lines, 1600))  # Between 16 and 1600 arrows (40x40)
        skip = max(1, int(grid_size / np.sqrt(target_arrows)))
        
        # Uniform arrow length - only direction matters
        arrow_length_mm = max(mag_length_mm, mag_width_mm) * 0.3  # 30% of larger dimension
        
        for i in range(0, grid_size, skip):
            for j in range(0, grid_size, skip):
                if B_mag[i, j] > 1e-10:
                    # Normalize direction and apply uniform length
                    B_norm = np.sqrt(Bx[i, j]**2 + By[i, j]**2)
                    if B_norm > 1e-10:
                        dx = (Bx[i, j] / B_norm) * arrow_length_mm
                        dy = (By[i, j] / B_norm) * arrow_length_mm
                        fig.add_annotation(
                            x=X_mm[i, j], y=Y_mm[i, j],
                            ax=X_mm[i, j] + dx,
                            ay=Y_mm[i, j] + dy,
                            xref='x', yref='y', axref='x', ayref='y',
                            showarrow=True, arrowhead=2, arrowsize=1,
                            arrowwidth=1.5, arrowcolor='rgba(255, 255, 255, 0.7)'
                        )
        
        # Add magnet shape
        if magnet_type == 'ring_segment':
            # Create ring segment path
            num_points = 50
            angles = np.linspace(math.radians(phi1), math.radians(phi2), num_points)
            outer_x = outer_r_mm * np.cos(angles)
            outer_y = outer_r_mm * np.sin(angles)
            inner_x = inner_r_mm * np.cos(angles[::-1])
            inner_y = inner_r_mm * np.sin(angles[::-1])
            x_coords = np.concatenate([outer_x, inner_x, [outer_x[0]]])
            y_coords = np.concatenate([outer_y, inner_y, [outer_y[0]]])
            
            fig.add_trace(go.Scatter(
                x=x_coords, y=y_coords, fill='toself',
                fillcolor='rgba(239, 68, 68, 0.3)',
                line=dict(color='rgb(239, 68, 68)', width=2),
                hoverinfo='skip', showlegend=False
            ))
        elif magnet_type == 'ring':
            # Full ring - outer circle
            theta = np.linspace(0, 2*np.pi, 100)
            fig.add_trace(go.Scatter(
                x=outer_r_mm * np.cos(theta), y=outer_r_mm * np.sin(theta),
                fill='toself', fillcolor='rgba(239, 68, 68, 0.3)',
                line=dict(color='rgb(239, 68, 68)', width=2),
                hoverinfo='skip', showlegend=False
            ))
            # Inner circle (hollow)
            fig.add_trace(go.Scatter(
                x=inner_r_mm * np.cos(theta), y=inner_r_mm * np.sin(theta),
                fill='toself', fillcolor='rgba(255, 255, 255, 1)',
                line=dict(color='rgb(239, 68, 68)', width=2),
                hoverinfo='skip', showlegend=False
            ))
        elif magnet_type == 'cylindrical':
            # Circle (Cylinder top view)
            theta = np.linspace(0, 2*np.pi, 100)
            radius_mm = mag_length_mm / 2  # mag_length_mm stores diameter for cylinders
            fig.add_trace(go.Scatter(
                x=radius_mm * np.cos(theta), y=radius_mm * np.sin(theta),
                fill='toself', fillcolor='rgba(239, 68, 68, 0.3)',
                line=dict(color='rgb(239, 68, 68)', width=2),
                hoverinfo='skip', showlegend=False
            ))
        else:
            # Rectangle (Cuboid top view)
            fig.add_shape(type="rect",
                x0=-mag_length_mm/2, y0=-mag_width_mm/2,
                x1=mag_length_mm/2, y1=mag_width_mm/2,
                line=dict(color="rgb(239, 68, 68)", width=2),
                fillcolor="rgba(239, 68, 68, 0.3)")
        
        # Add calculation point marker if provided
        calc_x = magnet_config.get('calcX')
        calc_y = magnet_config.get('calcY')
        if calc_x is not None and calc_y is not None:
            calc_x_mm = calc_x * 1000  # Convert m to mm
            # In X-Y plane view, we use actual calcY coordinate
            calc_y_mm = calc_y * 1000
            fig.add_trace(go.Scatter(
                x=[calc_x_mm], y=[calc_y_mm],
                mode='markers',
                marker=dict(size=10, color='blue', symbol='x'),
                name='Messpunkt',
                hovertemplate='Messpunkt<br>X: %{x:.2f} mm<br>Y: %{y:.2f} mm<extra></extra>'
            ))
        
        # Add line if provided
        line_start_x = magnet_config.get('lineStartX')
        line_start_y = magnet_config.get('lineStartY')
        line_end_x = magnet_config.get('lineEndX')
        line_end_y = magnet_config.get('lineEndY')
        if all(v is not None for v in [line_start_x, line_start_y, line_end_x, line_end_y]):
            line_start_x_mm = line_start_x * 1000
            line_start_y_mm = line_start_y * 1000  # Use actual Y coordinate
            line_end_x_mm = line_end_x * 1000
            line_end_y_mm = line_end_y * 1000
            fig.add_trace(go.Scatter(
                x=[line_start_x_mm, line_end_x_mm],
                y=[line_start_y_mm, line_end_y_mm],
                mode='lines+markers',
                line=dict(color='green', width=2, dash='dash'),
                marker=dict(size=8, color='green'),
                name='Messlinie',
                hovertemplate='Messlinie<extra></extra>'
            ))
        
        fig.update_xaxes(title="X (mm)", range=[-x_extent_mm/2, x_extent_mm/2])
        fig.update_yaxes(title="Y (mm)", range=[-y_extent_mm/2, y_extent_mm/2], scaleanchor="x", scaleratio=1)
        fig.update_layout(
            title="Magnetfeld (X-Y Ebene, Draufsicht)",
            width=700, height=700,
            hovermode='closest',
            template='plotly_white'
        )
    else:
        # X-Z plane (Y=0, side view)
        x_extent_mm = max(mag_length_mm, mag_width_mm) * padding_factor
        z_extent_mm = mag_height_mm * padding_factor
        x_mm = np.linspace(-x_extent_mm/2, x_extent_mm/2, grid_size)
        z_mm = np.linspace(-z_extent_mm/2, z_extent_mm/2, grid_size)
        X_mm, Z_mm = np.meshgrid(x_mm, z_mm)
        X_m, Z_m = X_mm / 1000, Z_mm / 1000
        
        # Vectorized field calculation
        observers = np.stack([X_m.flatten(), np.zeros(grid_size * grid_size), Z_m.flatten()], axis=-1)
        B = magpy.getB(magnet, observers)
        Bx = B[:, 0].reshape(grid_size, grid_size)
        By = B[:, 1].reshape(grid_size, grid_size)
        Bz = B[:, 2].reshape(grid_size, grid_size)
        B_mag = np.sqrt(Bx**2 + By**2 + Bz**2)
        
        # Create figure
        fig = go.Figure()
        
        # Add heatmap
        max_color = magnet_config.get('maxColorScale')
        heatmap_params = {
            'x': x_mm,
            'y': z_mm,
            'z': B_mag,
            'colorscale': 'Jet',
            'colorbar': dict(title="Flussdichte |B| [T]", tickformat='.4f'),
            'hovertemplate': 'X: %{x:.2f} mm<br>Z: %{y:.2f} mm<br>|B|: %{z:.4f} T<extra></extra>',
            'zauto': True
        }
        if max_color and max_color > 0:
            heatmap_params['zmin'] = 0
            heatmap_params['zmax'] = max_color
        
        fig.add_trace(go.Heatmap(**heatmap_params))
        
        # Add arrows - controlled by numFluxLines parameter
        num_flux_lines = magnet_config.get('numFluxLines', 8)
        # Calculate skip to get approximately the requested number of arrows
        # Limit to 1600 arrows (40x40) to prevent timeout - Plotly annotations are slow!
        target_arrows = max(4, min(num_flux_lines * num_flux_lines, 1600))  # Between 16 and 1600 arrows (40x40)
        skip = max(1, int(grid_size / np.sqrt(target_arrows)))
        
        # Uniform arrow length - only direction matters
        arrow_length_mm = max(mag_width_mm, mag_height_mm) * 0.3  # 30% of larger dimension
        
        for i in range(0, grid_size, skip):
            for j in range(0, grid_size, skip):
                if B_mag[i, j] > 1e-10:
                    # Normalize direction and apply uniform length
                    B_norm = np.sqrt(Bx[i, j]**2 + Bz[i, j]**2)
                    if B_norm > 1e-10:
                        dx = (Bx[i, j] / B_norm) * arrow_length_mm
                        dz = (Bz[i, j] / B_norm) * arrow_length_mm
                        fig.add_annotation(
                            x=X_mm[i, j], y=Z_mm[i, j],
                            ax=X_mm[i, j] + dx,
                            ay=Z_mm[i, j] + dz,
                            xref='x', yref='y', axref='x', ayref='y',
                            showarrow=True, arrowhead=2, arrowsize=1,
                            arrowwidth=1.5, arrowcolor='rgba(255, 255, 255, 0.7)'
                        )
        
        # Add magnet shape
        if magnet_type == 'ring_segment':
            # Ring segment cross-section: single rectangle (thickness = outer_r - inner_r)
            segment_thickness = outer_r_mm - inner_r_mm
            fig.add_shape(type="rect",
                x0=-segment_thickness/2, y0=-mag_height_mm/2,
                x1=segment_thickness/2, y1=mag_height_mm/2,
                line=dict(color="rgb(239, 68, 68)", width=2),
                fillcolor="rgba(239, 68, 68, 0.3)")
        elif magnet_type == 'ring':
            # Full ring cross-section: two rectangles (left and right)
            fig.add_shape(type="rect",
                x0=-outer_r_mm, y0=-mag_height_mm/2,
                x1=-inner_r_mm, y1=mag_height_mm/2,
                line=dict(color="rgb(239, 68, 68)", width=2),
                fillcolor="rgba(239, 68, 68, 0.3)")
            fig.add_shape(type="rect",
                x0=inner_r_mm, y0=-mag_height_mm/2,
                x1=outer_r_mm, y1=mag_height_mm/2,
                line=dict(color="rgb(239, 68, 68)", width=2),
                fillcolor="rgba(239, 68, 68, 0.3)")
        elif magnet_type == 'cylindrical':
            # Rectangle (Cylinder side view)
            # mag_length_mm stores diameter, mag_height_mm stores length for cylinders
            fig.add_shape(type="rect",
                x0=-mag_length_mm/2, y0=-mag_height_mm/2,
                x1=mag_length_mm/2, y1=mag_height_mm/2,
                line=dict(color="rgb(239, 68, 68)", width=2),
                fillcolor="rgba(239, 68, 68, 0.3)")
        else:
            # Rectangle (Cuboid side view)
            fig.add_shape(type="rect",
                x0=-mag_length_mm/2, y0=-mag_height_mm/2,
                x1=mag_length_mm/2, y1=mag_height_mm/2,
                line=dict(color="rgb(239, 68, 68)", width=2),
                fillcolor="rgba(239, 68, 68, 0.3)")
        
        # Add calculation point marker if provided
        calc_x = magnet_config.get('calcX')
        calc_z = magnet_config.get('calcZ')
        if calc_x is not None and calc_z is not None:
            calc_x_mm = calc_x * 1000  # Convert m to mm
            calc_z_mm = calc_z * 1000
            fig.add_trace(go.Scatter(
                x=[calc_x_mm], y=[calc_z_mm],
                mode='markers',
                marker=dict(size=10, color='blue', symbol='x'),
                name='Messpunkt',
                hovertemplate='Messpunkt<br>X: %{x:.2f} mm<br>Z: %{y:.2f} mm<extra></extra>'
            ))
        
        # Add line if provided
        line_start_x = magnet_config.get('lineStartX')
        line_start_z = magnet_config.get('lineStartZ')
        line_end_x = magnet_config.get('lineEndX')
        line_end_z = magnet_config.get('lineEndZ')
        if all(v is not None for v in [line_start_x, line_start_z, line_end_x, line_end_z]):
            line_start_x_mm = line_start_x * 1000
            line_start_z_mm = line_start_z * 1000
            line_end_x_mm = line_end_x * 1000
            line_end_z_mm = line_end_z * 1000
            fig.add_trace(go.Scatter(
                x=[line_start_x_mm, line_end_x_mm],
                y=[line_start_z_mm, line_end_z_mm],
                mode='lines+markers',
                line=dict(color='green', width=2, dash='dash'),
                marker=dict(size=8, color='green'),
                name='Messlinie',
                hovertemplate='Messlinie<extra></extra>'
            ))
        
        fig.update_xaxes(title="X (mm)", range=[-x_extent_mm/2, x_extent_mm/2])
        fig.update_yaxes(title="Z (mm)", range=[-z_extent_mm/2, z_extent_mm/2], scaleanchor="x", scaleratio=1)
        fig.update_layout(
            title="Magnetfeld (X-Z Ebene, Seitenansicht)",
            width=700, height=700,
            hovermode='closest',
            template='plotly_white'
        )
    
    return {'plotlyJson': fig.to_json()}



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
    if magnet_type == 'rectangular':
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
    if magnet_type == 'rectangular':
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
        # CylinderSegment expects RADII not DIAMETERS!
        magnet = magpy.magnet.CylinderSegment(
            polarization=polarization,
            dimension=(inner_diameter/2, outer_diameter/2, thickness, 0, 360)
        )
    elif magnet_type == 'ring_segment':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        phi1 = magnet_config.get('phi1', 0)
        phi2 = magnet_config.get('phi2', 90)
        
        if magnetization_type == 'radial':
            # Radial magnetization: discretize segment into sub-segments
            angle_span = phi2 - phi1
            num_segments = max(4, int(angle_span / 15))
            segment_angle = angle_span / num_segments
            
            magnets = []
            for i in range(num_segments):
                sub_phi1 = phi1 + i * segment_angle
                sub_phi2 = phi1 + (i + 1) * segment_angle
                mid_angle = (sub_phi1 + sub_phi2) / 2
                mid_angle_rad = math.radians(mid_angle)
                
                px = magnetization * math.cos(mid_angle_rad)
                py = magnetization * math.sin(mid_angle_rad)
                
                # CylinderSegment expects RADII not DIAMETERS!
                sub_magnet = magpy.magnet.CylinderSegment(
                    polarization=(px, py, 0),
                    dimension=(inner_diameter/2, outer_diameter/2, thickness, sub_phi1, sub_phi2)
                )
                magnets.append(sub_magnet)
            
            magnet = magpy.Collection(*magnets)
        else:
            polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
            if magnetization_type == 'axial':
                polarization = (polarization[0], polarization[1], -polarization[2])
            # CylinderSegment expects RADII not DIAMETERS!
            magnet = magpy.magnet.CylinderSegment(
                polarization=polarization,
                dimension=(inner_diameter/2, outer_diameter/2, thickness, phi1, phi2)
            )
    else:
        raise ValueError(f"Unknown magnet type: {magnet_type}")
    
    # Generate points along the line (in Magpylib coordinates)
    line_points_magpylib = np.linspace(start_magpylib, end_magpylib, num_points)
    # Also generate corresponding UI coordinates for distance calculation
    line_points_ui = np.linspace(start_ui, end_ui, num_points)
    
    # Calculate B field at each point
    Bx_values = []
    By_values = []
    Bz_values = []
    distances = []  # Distance from start point along the line
    
    for i, point_magpylib in enumerate(line_points_magpylib):
        B = magpy.getB(magnet, point_magpylib)
        Bx_values.append(float(B[0]))
        By_values.append(float(B[1]))
        Bz_values.append(float(B[2]))
        # Calculate distance from start along the line (in mm for display)
        # IMPORTANT: Use UI coordinates for distance calculation so it matches user expectations
        # This ensures "distance 1mm" corresponds to z_ui=1mm, not z_magpylib=1mm
        point_ui = line_points_ui[i]
        distances.append(float(np.linalg.norm(point_ui - start_ui) * 1000))
    
    # Create Plotly chart
    fig = go.Figure()
    
    # Convert to mT for display
    Bx_mT = [b * 1000 for b in Bx_values]
    By_mT = [b * 1000 for b in By_values]
    Bz_mT = [b * 1000 for b in Bz_values]
    
    # Add traces for Bx, By, Bz
    fig.add_trace(go.Scatter(
        x=distances,
        y=Bx_mT,
        mode='lines',
        name='Bx',
        line=dict(color='rgb(239, 68, 68)', width=2),
        hovertemplate='Distance: %{x:.2f} mm<br>Bx: %{y:.4f} mT<extra></extra>'
    ))
    
    fig.add_trace(go.Scatter(
        x=distances,
        y=By_mT,
        mode='lines',
        name='By',
        line=dict(color='rgb(34, 197, 94)', width=2),
        hovertemplate='Distance: %{x:.2f} mm<br>By: %{y:.4f} mT<extra></extra>'
    ))
    
    fig.add_trace(go.Scatter(
        x=distances,
        y=Bz_mT,
        mode='lines',
        name='Bz',
        line=dict(color='rgb(59, 130, 246)', width=2),
        hovertemplate='Distance: %{x:.2f} mm<br>Bz: %{y:.4f} mT<extra></extra>'
    ))
    
    # Add zero line
    fig.add_hline(y=0, line_dash="dash", line_color="rgba(0, 0, 0, 0.3)", line_width=1)
    
    # Update layout
    fig.update_layout(
        title='Feldkomponenten entlang der Linie',
        xaxis_title='Distanz entlang Linie (mm)',
        yaxis_title='Magnetische Flussdichte (mT)',
        width=800,
        height=500,
        template='plotly_white',
        hovermode='x unified',
        showlegend=True,
        legend=dict(x=1.02, y=1, xanchor='left', yanchor='top')
    )
    
    fig.update_xaxes(showgrid=True, gridcolor='rgba(0, 0, 0, 0.1)')
    fig.update_yaxes(showgrid=True, gridcolor='rgba(0, 0, 0, 0.1)')
    
    return {
        'plotlyJson': fig.to_json()
    }


def calculate_circle_field(magnet_config):
    """
    Calculate magnetic field along a circular path and decompose into cylindrical coordinates.
    Returns Plotly JSON showing Br (radial), Bt (tangential), Bz (axial) vs angle.
    
    Args:
        magnet_config: Dict with keys:
            - type, magnetization, dimensions (as in calculate_field)
            - radius: Circle radius in meters
            - centerX, centerY, centerZ: Circle center offset in meters
            - numSamples: Number of angle samples (default: 360)
    
    Returns:
        Dict with Plotly JSON
    """
    magnet_type = magnet_config['type']
    magnetization = magnet_config['magnetization']
    magnetization_type = magnet_config.get('magnetizationType', 'axial')
    magnetization_angle = magnet_config.get('magnetizationAngle', 0)
    
    # Circle parameters
    radius = magnet_config['radius']
    center_x = magnet_config.get('centerX', 0)
    center_y = magnet_config.get('centerY', 0)
    center_z_ui = magnet_config.get('centerZ', 0)
    num_samples = magnet_config.get('numSamples', 360)
    
    # Determine magnet height for coordinate transformation
    if magnet_type == 'rectangular':
        magnet_height = magnet_config.get('height', 0.01)
    elif magnet_type == 'cylindrical':
        magnet_height = magnet_config.get('length', 0.01)
    elif magnet_type in ['ring', 'ring_segment', 'ring_multi_segment']:
        magnet_height = magnet_config.get('thickness', 0.01)
    else:
        magnet_height = 0.01
    
    # Transform Z coordinate: UI has z=0 at surface, Magpylib has z=0 at center
    center_z_magpylib = center_z_ui + magnet_height / 2
    
    # Create magnet (reuse logic from calculate_field)
    if magnet_type == 'rectangular':
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
            dimension=(inner_diameter/2, outer_diameter/2, thickness, 0, 360)
        )
    elif magnet_type == 'ring_segment':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        phi1 = magnet_config.get('phi1', 0)
        phi2 = magnet_config.get('phi2', 90)
        
        if magnetization_type == 'radial':
            angle_span = phi2 - phi1
            num_segments = max(4, int(angle_span / 15))
            segment_angle = angle_span / num_segments
            magnets = []
            for i in range(num_segments):
                sub_phi1 = phi1 + i * segment_angle
                sub_phi2 = phi1 + (i + 1) * segment_angle
                mid_angle = (sub_phi1 + sub_phi2) / 2
                mid_angle_rad = math.radians(mid_angle)
                px = magnetization * math.cos(mid_angle_rad)
                py = magnetization * math.sin(mid_angle_rad)
                sub_magnet = magpy.magnet.CylinderSegment(
                    polarization=(px, py, 0),
                    dimension=(inner_diameter/2, outer_diameter/2, thickness, sub_phi1, sub_phi2)
                )
                magnets.append(sub_magnet)
            magnet = magpy.Collection(*magnets)
        else:
            polarization = get_polarization_vector(magnetization, magnetization_type, magnetization_angle)
            if magnetization_type == 'axial':
                polarization = (polarization[0], polarization[1], -polarization[2])
            magnet = magpy.magnet.CylinderSegment(
                polarization=polarization,
                dimension=(inner_diameter/2, outer_diameter/2, thickness, phi1, phi2)
            )
    elif magnet_type == 'ring_multi_segment':
        magnet = create_multi_segment_ring(magnet_config)
    else:
        raise ValueError(f"Unknown magnet type: {magnet_type}")
    
    # Generate angles and calculate positions on circle
    angles_deg = np.linspace(0, 360, num_samples, endpoint=False)
    Br_values = []
    Bt_values = []
    Bz_values = []
    
    for angle_deg in angles_deg:
        angle_rad = math.radians(angle_deg)
        
        # Position on circle (in X-Y plane, offset by center)
        x = center_x + radius * math.cos(angle_rad)
        y = center_y + radius * math.sin(angle_rad)
        z = center_z_magpylib
        
        # Calculate B field
        observer = np.array([x, y, z])
        B = magpy.getB(magnet, observer)
        Bx, By, Bz_cart = float(B[0]), float(B[1]), float(B[2])
        
        # Convert to cylindrical coordinates
        # Radial unit vector at this angle
        r_hat_x = math.cos(angle_rad)
        r_hat_y = math.sin(angle_rad)
        # Tangential unit vector (perpendicular to radial, in X-Y plane)
        t_hat_x = -math.sin(angle_rad)
        t_hat_y = math.cos(angle_rad)
        
        # Project B field onto cylindrical basis
        Br = Bx * r_hat_x + By * r_hat_y  # Radial component
        Bt = Bx * t_hat_x + By * t_hat_y  # Tangential component
        Bz = Bz_cart  # Axial component (unchanged)
        
        Br_values.append(Br * 1000)  # Convert to mT
        Bt_values.append(Bt * 1000)
        Bz_values.append(Bz * 1000)
    
    # Create Plotly chart
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=angles_deg,
        y=Br_values,
        mode='lines',
        name='Br (radial)',
        line=dict(color='rgb(239, 68, 68)', width=2),
        hovertemplate='Winkel: %{x:.1f}°<br>Br: %{y:.4f} mT<extra></extra>'
    ))
    
    fig.add_trace(go.Scatter(
        x=angles_deg,
        y=Bt_values,
        mode='lines',
        name='Bt (tangential)',
        line=dict(color='rgb(34, 197, 94)', width=2),
        hovertemplate='Winkel: %{x:.1f}°<br>Bt: %{y:.4f} mT<extra></extra>'
    ))
    
    fig.add_trace(go.Scatter(
        x=angles_deg,
        y=Bz_values,
        mode='lines',
        name='Bz (axial)',
        line=dict(color='rgb(59, 130, 246)', width=2),
        hovertemplate='Winkel: %{x:.1f}°<br>Bz: %{y:.4f} mT<extra></extra>'
    ))
    
    # Add zero line
    fig.add_hline(y=0, line_dash="dash", line_color="rgba(0, 0, 0, 0.3)", line_width=1)
    
    # Update layout
    fig.update_layout(
        title='Feldkomponenten auf konzentrischem Kreis',
        xaxis_title='Winkel (Grad)',
        yaxis_title='Magnetische Flussdichte (mT)',
        width=800,
        height=500,
        template='plotly_white',
        hovermode='x unified',
        showlegend=True,
        legend=dict(x=1.02, y=1, xanchor='left', yanchor='top')
    )
    
    fig.update_xaxes(showgrid=True, gridcolor='rgba(0, 0, 0, 0.1)', range=[0, 360])
    fig.update_yaxes(showgrid=True, gridcolor='rgba(0, 0, 0, 0.1)')
    
    return {'plotlyJson': fig.to_json()}


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
        elif mode == 'circle':
            result = calculate_circle_field(input_data)
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
