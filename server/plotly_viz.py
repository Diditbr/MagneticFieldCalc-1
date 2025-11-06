#!/usr/bin/env python3
"""
Plotly-based visualization for magnetic fields.
"""

import numpy as np
import plotly.graph_objects as go
import math


def create_ring_segment_shape(inner_r_mm, outer_r_mm, phi1, phi2, z_center_mm, thickness_mm):
    """Create shapes for ring segment visualization in X-Y plane."""
    shapes = []
    
    # Create arcs for ring segment
    num_points = 50
    angles = np.linspace(math.radians(phi1), math.radians(phi2), num_points)
    
    # Outer arc
    outer_x = outer_r_mm * np.cos(angles)
    outer_y = outer_r_mm * np.sin(angles)
    
    # Inner arc (reversed)
    inner_x = inner_r_mm * np.cos(angles[::-1])
    inner_y = inner_r_mm * np.sin(angles[::-1])
    
    # Combine to create closed polygon
    x_coords = np.concatenate([outer_x, inner_x, [outer_x[0]]])
    y_coords = np.concatenate([outer_y, inner_y, [outer_y[0]]])
    
    # Create filled shape
    shape = dict(
        type="path",
        path=f"M {x_coords[0]},{y_coords[0]} " + " ".join([f"L {x},{y}" for x, y in zip(x_coords[1:], y_coords[1:])]) + " Z",
        fillcolor="rgba(239, 68, 68, 0.2)",
        line=dict(color="rgb(239, 68, 68)", width=2),
        layer="below"
    )
    
    return [shape]


def generate_plotly_visualization(magnet, magnet_type, magnet_config, magnetization_type):
    """
    Generate Plotly visualization with automatic plane selection.
    
    Args:
        magnet: Magpylib magnet object or Collection
        magnet_type: Type of magnet ('rectangular', 'cylindrical', 'ring', 'ring_segment')
        magnet_config: Configuration dict with dimensions
        magnetization_type: 'axial', 'radial', or 'diametral'
    
    Returns:
        Dict with Plotly JSON
    """
    import magpylib as magpy
    
    # Determine view plane based on magnet type and magnetization
    use_xy_plane = False
    if (magnet_type in ['ring', 'ring_segment']) and (magnetization_type in ['radial', 'diametral']):
        use_xy_plane = True
    
    # Get dimensions
    if magnet_type == 'rectangular':
        length = magnet_config.get('length', 0.01)
        width = magnet_config.get('width', 0.01)
        height = magnet_config.get('height', 0.01)
        mag_dim1, mag_dim2 = length * 1000, height * 1000  # mm
        inner_r_mm, outer_r_mm = 0, 0
        phi1, phi2 = 0, 360
    elif magnet_type == 'cylindrical':
        diameter = magnet_config.get('diameter', 0.01)
        length = magnet_config.get('length', 0.01)
        mag_dim1, mag_dim2 = diameter * 1000, length * 1000
        inner_r_mm, outer_r_mm = 0, 0
        phi1, phi2 = 0, 360
    elif magnet_type == 'ring':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        mag_dim1 = outer_diameter * 1000
        mag_dim2 = thickness * 1000
        inner_r_mm = inner_diameter * 500
        outer_r_mm = outer_diameter * 500
        phi1, phi2 = 0, 360
    elif magnet_type == 'ring_segment':
        outer_diameter = magnet_config.get('diameter', 0.01)
        inner_diameter = magnet_config.get('innerDiameter', 0.005)
        thickness = magnet_config.get('thickness', 0.01)
        phi1 = magnet_config.get('phi1', 0)
        phi2 = magnet_config.get('phi2', 90)
        mag_dim1 = outer_diameter * 1000
        mag_dim2 = thickness * 1000
        inner_r_mm = inner_diameter * 500
        outer_r_mm = outer_diameter * 500
    else:
        mag_dim1, mag_dim2 = 10, 10
        inner_r_mm, outer_r_mm = 0, 0
        phi1, phi2 = 0, 360
    
    # Grid setup
    padding_factor = 5.0
    extent1 = mag_dim1 * padding_factor
    extent2 = mag_dim2 * padding_factor
    
    # Smaller grid for ring segments
    if magnet_type == 'ring_segment':
        grid_size = 30
    elif magnet_type == 'ring':
        grid_size = 40
    else:
        grid_size = 50
    
    if use_xy_plane:
        # X-Y plane (Z=0, top view)
        x_mm = np.linspace(-extent1/2, extent1/2, grid_size)
        y_mm = np.linspace(-extent1/2, extent1/2, grid_size)
        X_mm, Y_mm = np.meshgrid(x_mm, y_mm)
        X_m, Y_m = X_mm / 1000, Y_mm / 1000
        
        # Calculate field
        Bx = np.zeros_like(X_mm)
        By = np.zeros_like(Y_mm)
        B_mag = np.zeros_like(X_mm)
        
        for i in range(grid_size):
            for j in range(grid_size):
                observer = np.array([X_m[i, j], Y_m[i, j], 0])
                B = magpy.getB(magnet, observer)
                Bx[i, j] = B[0]
                By[i, j] = B[1]
                B_mag[i, j] = np.sqrt(B[0]**2 + B[1]**2 + B[2]**2)
        
        # Create Plotly figure with quiver plot
        # Downsample for arrow display
        skip = max(1, grid_size // 15)
        
        fig = go.Figure()
        
        # Add quiver (vector field)
        fig.add_trace(go.Scatter(
            x=X_mm[::skip, ::skip].flatten(),
            y=Y_mm[::skip, ::skip].flatten(),
            mode='markers',
            marker=dict(
                size=8,
                color=B_mag[::skip, ::skip].flatten(),
                colorscale='Viridis',
                showscale=True,
                colorbar=dict(title="Flussdichte |B| [T]", x=1.02),
                line=dict(width=0)
            ),
            customdata=np.stack([
                Bx[::skip, ::skip].flatten(),
                By[::skip, ::skip].flatten(),
                B_mag[::skip, ::skip].flatten()
            ], axis=-1),
            hovertemplate='X: %{x:.2f} mm<br>Y: %{y:.2f} mm<br>Bx: %{customdata[0]:.4f} T<br>By: %{customdata[1]:.4f} T<br>|B|: %{customdata[2]:.4f} T<extra></extra>',
            name='Magnetfeld'
        ))
        
        # Add vector arrows
        for i in range(0, grid_size, skip):
            for j in range(0, grid_size, skip):
                if B_mag[i, j] > 1e-10:
                    scale = 2000 * B_mag[i, j] / B_mag.max()
                    fig.add_annotation(
                        x=X_mm[i, j],
                        y=Y_mm[i, j],
                        ax=X_mm[i, j] + Bx[i, j] * scale,
                        ay=Y_mm[i, j] + By[i, j] * scale,
                        xref='x', yref='y',
                        axref='x', ayref='y',
                        showarrow=True,
                        arrowhead=2,
                        arrowsize=1,
                        arrowwidth=1.5,
                        arrowcolor='rgba(100, 100, 100, 0.5)'
                    )
        
        # Add magnet shape
        if magnet_type == 'ring_segment':
            shapes = create_ring_segment_shape(inner_r_mm, outer_r_mm, phi1, phi2, 0, mag_dim2)
            fig.update_layout(shapes=shapes)
        elif magnet_type == 'ring':
            # Full ring
            fig.add_shape(type="circle", x0=-outer_r_mm, y0=-outer_r_mm, x1=outer_r_mm, y1=outer_r_mm,
                         line=dict(color="rgb(239, 68, 68)", width=2), fillcolor="rgba(239, 68, 68, 0.2)")
            fig.add_shape(type="circle", x0=-inner_r_mm, y0=-inner_r_mm, x1=inner_r_mm, y1=inner_r_mm,
                         line=dict(color="rgb(239, 68, 68)", width=2), fillcolor="rgba(255, 255, 255, 1)")
        else:
            # Rectangle
            fig.add_shape(type="rect", x0=-mag_dim1/2, y0=-mag_dim1/2, x1=mag_dim1/2, y1=mag_dim1/2,
                         line=dict(color="rgb(239, 68, 68)", width=2), fillcolor="rgba(239, 68, 68, 0.2)")
        
        fig.update_xaxes(title="X (mm)", range=[-extent1/2, extent1/2])
        fig.update_yaxes(title="Y (mm)", range=[-extent1/2, extent1/2], scaleanchor="x", scaleratio=1)
        fig.update_layout(
            title="Magnetfeld (X-Y Ebene, Draufsicht)",
            width=700,
            height=700,
            hovermode='closest',
            template='plotly_white'
        )
        
    else:
        # X-Z plane (Y=0, side view)
        x_mm = np.linspace(-extent1/2, extent1/2, grid_size)
        z_mm = np.linspace(-extent2/2, extent2/2, grid_size)
        X_mm, Z_mm = np.meshgrid(x_mm, z_mm)
        X_m, Z_m = X_mm / 1000, Z_mm / 1000
        
        # Calculate field
        Bx = np.zeros_like(X_mm)
        Bz = np.zeros_like(Z_mm)
        B_mag = np.zeros_like(X_mm)
        
        for i in range(grid_size):
            for j in range(grid_size):
                observer = np.array([X_m[i, j], 0, Z_m[i, j]])
                B = magpy.getB(magnet, observer)
                Bx[i, j] = B[0]
                Bz[i, j] = B[2]
                B_mag[i, j] = np.sqrt(B[0]**2 + B[1]**2 + B[2]**2)
        
        # Create figure
        skip = max(1, grid_size // 15)
        
        fig = go.Figure()
        
        # Add quiver (vector field)
        fig.add_trace(go.Scatter(
            x=X_mm[::skip, ::skip].flatten(),
            y=Z_mm[::skip, ::skip].flatten(),
            mode='markers',
            marker=dict(
                size=8,
                color=B_mag[::skip, ::skip].flatten(),
                colorscale='Viridis',
                showscale=True,
                colorbar=dict(title="Flussdichte |B| [T]", x=1.02),
                line=dict(width=0)
            ),
            customdata=np.stack([
                Bx[::skip, ::skip].flatten(),
                Bz[::skip, ::skip].flatten(),
                B_mag[::skip, ::skip].flatten()
            ], axis=-1),
            hovertemplate='X: %{x:.2f} mm<br>Z: %{y:.2f} mm<br>Bx: %{customdata[0]:.4f} T<br>Bz: %{customdata[1]:.4f} T<br>|B|: %{customdata[2]:.4f} T<extra></extra>',
            name='Magnetfeld'
        ))
        
        # Add vector arrows
        for i in range(0, grid_size, skip):
            for j in range(0, grid_size, skip):
                if B_mag[i, j] > 1e-10:
                    scale = 2000 * B_mag[i, j] / B_mag.max()
                    fig.add_annotation(
                        x=X_mm[i, j],
                        y=Z_mm[i, j],
                        ax=X_mm[i, j] + Bx[i, j] * scale,
                        ay=Z_mm[i, j] + Bz[i, j] * scale,
                        xref='x', yref='y',
                        axref='x', ayref='y',
                        showarrow=True,
                        arrowhead=2,
                        arrowsize=1,
                        arrowwidth=1.5,
                        arrowcolor='rgba(100, 100, 100, 0.5)'
                    )
        
        # Add magnet shape (side view)
        if magnet_type in ['ring', 'ring_segment']:
            # Show cross-section
            # Left piece
            fig.add_shape(type="rect", x0=-outer_r_mm, y0=-mag_dim2/2, x1=-inner_r_mm, y1=mag_dim2/2,
                         line=dict(color="rgb(239, 68, 68)", width=2), fillcolor="rgba(239, 68, 68, 0.2)")
            # Right piece
            fig.add_shape(type="rect", x0=inner_r_mm, y0=-mag_dim2/2, x1=outer_r_mm, y1=mag_dim2/2,
                         line=dict(color="rgb(239, 68, 68)", width=2), fillcolor="rgba(239, 68, 68, 0.2)")
            # Hollow center
            fig.add_shape(type="rect", x0=-inner_r_mm, y0=-mag_dim2/2, x1=inner_r_mm, y1=mag_dim2/2,
                         line=dict(color="rgb(136, 136, 136)", width=1, dash="dash"), fillcolor="rgba(255, 255, 255, 1)")
        else:
            # Solid rectangle
            fig.add_shape(type="rect", x0=-mag_dim1/2, y0=-mag_dim2/2, x1=mag_dim1/2, y1=mag_dim2/2,
                         line=dict(color="rgb(239, 68, 68)", width=2), fillcolor="rgba(239, 68, 68, 0.2)")
        
        fig.update_xaxes(title="X (mm)", range=[-extent1/2, extent1/2])
        fig.update_yaxes(title="Z (mm)", range=[-extent2/2, extent2/2], scaleanchor="x", scaleratio=1)
        fig.update_layout(
            title="Magnetfeld (X-Z Ebene, Seitenansicht)",
            width=700,
            height=700,
            hovermode='closest',
            template='plotly_white'
        )
    
    # Return Plotly JSON
    return fig.to_json()
