#!/usr/bin/env python3
"""
Magnetic field report generator using WeasyPrint for PDF generation.
Accepts JSON input via stdin and returns base64-encoded PDF via JSON output.
"""

import json
import sys
import base64
import io
import os
import subprocess
from datetime import datetime
from weasyprint import HTML, CSS
import plotly.graph_objects as go

# Configure Chromium path for Kaleido (required on Nix/Replit)
def find_chromium_path():
    """Find Chromium executable path."""
    # Try to find chromium binary
    try:
        result = subprocess.run(['which', 'chromium-browser'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except:
        pass
    
    try:
        result = subprocess.run(['which', 'chromium'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except:
        pass
    
    return None

# Set Chromium path for Kaleido
chromium_path = find_chromium_path()
if chromium_path:
    # Try multiple environment variables that Kaleido might check
    os.environ['PLOTLY_KALEIDO_CHROMIUM_PATH'] = chromium_path
    os.environ['CHROME_PATH'] = chromium_path
    os.environ['CHROMIUM_EXECUTABLE'] = chromium_path

# Import kaleido and configure chromium path directly
try:
    import kaleido
    from kaleido.scopes.plotly import PlotlyScope
    
    # Create a custom scope with chromium path
    if chromium_path:
        scope = PlotlyScope(chromium_path=chromium_path)
    else:
        scope = PlotlyScope()
        
    def to_image_safe(fig, format='png', width=600, height=300):
        """Safely convert Plotly figure to image."""
        try:
            # Use the configured scope
            return scope.transform(fig, format=format, width=width, height=height)
        except Exception as e:
            # Fallback: try default method
            from plotly.io import to_image as plotly_to_image
            return plotly_to_image(fig, format=format, width=width, height=height)
            
except ImportError:
    # Fallback if kaleido not available
    from plotly.io import to_image as to_image_safe


def generate_html_template(report_data):
    """
    Generate HTML template for the report.
    
    Args:
        report_data: Dict with report configuration and data
        
    Returns:
        HTML string
    """
    sections = report_data.get('sections', [])
    inputs = report_data.get('inputs', {})
    length_unit = report_data.get('lengthUnit', 'mm')
    field_unit = report_data.get('fieldUnit', 'mT')
    
    # Start HTML template
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {{
            size: A4;
            margin: 15mm 15mm 20mm 15mm;
        }}
        
        body {{
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #1a1a1a;
        }}
        
        h1 {{
            font-size: 18pt;
            font-weight: 600;
            margin: 0 0 8pt 0;
            color: #0066cc;
            border-bottom: 2pt solid #0066cc;
            padding-bottom: 4pt;
        }}
        
        h2 {{
            font-size: 13pt;
            font-weight: 600;
            margin: 12pt 0 6pt 0;
            color: #333;
        }}
        
        h3 {{
            font-size: 11pt;
            font-weight: 600;
            margin: 8pt 0 4pt 0;
            color: #555;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 6pt 0;
            font-size: 9pt;
        }}
        
        th {{
            background-color: #f5f5f5;
            border: 1pt solid #ddd;
            padding: 4pt 6pt;
            text-align: left;
            font-weight: 600;
        }}
        
        td {{
            border: 1pt solid #ddd;
            padding: 4pt 6pt;
        }}
        
        .mono {{
            font-family: 'JetBrains Mono', monospace;
        }}
        
        .header-info {{
            margin-bottom: 12pt;
            font-size: 9pt;
            color: #666;
        }}
        
        .section {{
            margin-top: 12pt;
            page-break-inside: avoid;
        }}
        
        .chart-container {{
            margin: 8pt 0;
            text-align: center;
        }}
        
        .chart-container img {{
            max-width: 100%;
            height: auto;
        }}
        
        .input-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4pt;
            margin: 6pt 0;
        }}
        
        .input-item {{
            display: flex;
            justify-content: space-between;
            padding: 2pt 0;
        }}
        
        .input-label {{
            font-weight: 500;
        }}
        
        .input-value {{
            font-family: 'JetBrains Mono', monospace;
            color: #0066cc;
        }}
        
        .page-break {{
            page-break-before: always;
        }}
    </style>
</head>
<body>
    <h1>Magnetfeld-Berechnung - Bericht</h1>
    <div class="header-info">
        Erstellt am: {datetime.now().strftime('%d.%m.%Y um %H:%M')}
    </div>
"""
    
    # Add input data section (always included)
    html += generate_input_section(inputs, length_unit, field_unit)
    
    # Add selected sections
    if 'point_calculation' in sections:
        html += generate_point_section(inputs.get('point'), field_unit)
    
    if 'line_measurement' in sections:
        html += generate_line_section(inputs.get('line', []), length_unit, field_unit)
    
    if 'circle_measurement' in sections:
        html += generate_circle_section(inputs.get('circle', []), length_unit, field_unit)
    
    if 'zero_crossings' in sections:
        html += generate_zero_crossings_section(inputs.get('circle', []))
    
    if 'field_visualization' in sections:
        html += generate_visualization_section(inputs.get('visualization'))
    
    if 'documentation' in sections:
        html += generate_documentation_section()
    
    html += """
</body>
</html>
"""
    
    return html


def generate_input_section(inputs, length_unit, field_unit):
    """Generate HTML for input parameters section."""
    # Extract input data from first available request
    point_data = inputs.get('point')
    viz_input = inputs.get('visualization')
    
    # point_data has structure: { request: {...}, result: {...} }
    # We need the 'request' part which contains the magnet parameters
    if point_data and isinstance(point_data, dict):
        input_data = point_data.get('request')
    elif viz_input:
        input_data = viz_input
    else:
        input_data = None
    
    if not input_data:
        return ""
    
    magnet_type_names = {
        'cylindrical': 'Rundmagnet',
        'rectangular': 'Vierkantmagnet',
        'ring': 'Ringmagnet',
        'ring_segment': 'Ringsegment',
        'ring_multi_segment': 'Multi-Segment-Ring'
    }
    
    magnetization_type_names = {
        'axial': 'Axial',
        'diametral': 'Diametral',
        'radial': 'Radial'
    }
    
    html = """
    <div class="section">
        <h2>Eingabedaten</h2>
        <div class="input-grid">
"""
    
    # Magnet type
    magnet_type = input_data.get('type', 'rectangular')
    html += f"""
            <div class="input-item">
                <span class="input-label">Magnettyp:</span>
                <span class="input-value">{magnet_type_names.get(magnet_type, magnet_type)}</span>
            </div>
"""
    
    # Magnetization
    magnetization = input_data.get('magnetization', 0) * 1000  # T to mT
    html += f"""
            <div class="input-item">
                <span class="input-label">Remanenz:</span>
                <span class="input-value">{magnetization:.1f} mT</span>
            </div>
"""
    
    # Magnetization type
    mag_type = input_data.get('magnetizationType', 'axial')
    html += f"""
            <div class="input-item">
                <span class="input-label">Magnetisierung:</span>
                <span class="input-value">{magnetization_type_names.get(mag_type, mag_type)}</span>
            </div>
"""
    
    # Dimensions based on magnet type
    if magnet_type == 'rectangular':
        length = input_data.get('length', 0) * 1000  # m to mm
        width = input_data.get('width', 0) * 1000
        height = input_data.get('height', 0) * 1000
        html += f"""
            <div class="input-item">
                <span class="input-label">Länge:</span>
                <span class="input-value">{length:.2f} mm</span>
            </div>
            <div class="input-item">
                <span class="input-label">Breite:</span>
                <span class="input-value">{width:.2f} mm</span>
            </div>
            <div class="input-item">
                <span class="input-label">Höhe:</span>
                <span class="input-value">{height:.2f} mm</span>
            </div>
"""
    elif magnet_type == 'cylindrical':
        diameter = input_data.get('diameter', 0) * 1000
        height = input_data.get('height', 0) * 1000
        html += f"""
            <div class="input-item">
                <span class="input-label">Durchmesser:</span>
                <span class="input-value">{diameter:.2f} mm</span>
            </div>
            <div class="input-item">
                <span class="input-label">Höhe:</span>
                <span class="input-value">{height:.2f} mm</span>
            </div>
"""
    elif magnet_type in ['ring', 'ring_segment', 'ring_multi_segment']:
        diameter = input_data.get('diameter', 0) * 1000
        inner_diameter = input_data.get('innerDiameter', 0) * 1000
        thickness = input_data.get('thickness', 0) * 1000
        html += f"""
            <div class="input-item">
                <span class="input-label">Außendurchmesser:</span>
                <span class="input-value">{diameter:.2f} mm</span>
            </div>
            <div class="input-item">
                <span class="input-label">Innendurchmesser:</span>
                <span class="input-value">{inner_diameter:.2f} mm</span>
            </div>
            <div class="input-item">
                <span class="input-label">Dicke:</span>
                <span class="input-value">{thickness:.2f} mm</span>
            </div>
"""
        
        if magnet_type == 'ring_multi_segment':
            num_poles = input_data.get('numPoles', 4)
            html += f"""
            <div class="input-item">
                <span class="input-label">Anzahl Pole:</span>
                <span class="input-value">{num_poles}</span>
            </div>
"""
    
    html += """
        </div>
    </div>
"""
    
    return html


def generate_point_section(point_data, field_unit):
    """Generate HTML for point calculation section."""
    if not point_data:
        return ""
    
    # Extract input and result
    point_input = point_data.get('request', {})
    result = point_data.get('result', {})
    
    if not result:
        return ""
    
    x = point_input.get('x', 0) * 1000  # m to mm
    y = point_input.get('y', 0) * 1000
    z = point_input.get('z', 0) * 1000
    
    html = f"""
    <div class="section">
        <h2>Punkt-Berechnung</h2>
        <p>Berechnung der Magnetfeldstärke am Punkt ({x:.2f}, {y:.2f}, {z:.2f}) mm</p>
        <table>
            <tr>
                <th>Komponente</th>
                <th>Wert ({field_unit})</th>
            </tr>
"""
    
    # Convert field values
    factor = 1.0
    if field_unit == 'mT':
        factor = 1000.0
    elif field_unit == 'G':
        factor = 10000.0
    elif field_unit == 'kG':
        factor = 10.0
    
    bx = result.get('Bx', 0) * factor
    by = result.get('By', 0) * factor
    bz = result.get('Bz', 0) * factor
    
    html += f"""
            <tr>
                <td>Bx</td>
                <td class="mono">{bx:.4f}</td>
            </tr>
            <tr>
                <td>By</td>
                <td class="mono">{by:.4f}</td>
            </tr>
            <tr>
                <td>Bz</td>
                <td class="mono">{bz:.4f}</td>
            </tr>
        </table>
    </div>
"""
    
    return html


def generate_line_section(line_data_list, length_unit, field_unit):
    """Generate HTML for line measurement section with charts."""
    if not line_data_list or len(line_data_list) == 0:
        return ""
    
    html = """
    <div class="section">
        <h2>Linien-Messung</h2>
"""
    
    for i, line_data in enumerate(line_data_list):
        plotly_json = line_data.get('plotlyJson')
        if not plotly_json:
            continue
            
        plotly_data = json.loads(plotly_json)
        
        # Export chart to PNG
        fig = go.Figure(plotly_data)
        img_bytes = to_image_safe(fig, format='png', width=600, height=300)
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        line_num = i + 1
        html += f"""
        <h3>Linie {line_num}</h3>
        <div class="chart-container">
            <img src="data:image/png;base64,{img_base64}" alt="Linien-Messung {line_num}">
        </div>
"""
    
    html += """
    </div>
"""
    
    return html


def generate_circle_section(circle_data_list, length_unit, field_unit):
    """Generate HTML for circle measurement section with charts."""
    if not circle_data_list or len(circle_data_list) == 0:
        return ""
    
    html = """
    <div class="section">
        <h2>Kreis-Messung</h2>
"""
    
    for i, circle_data in enumerate(circle_data_list):
        circle_request = circle_data.get('request', {})
        plotly_json = circle_data.get('plotlyJson')
        
        if not plotly_json:
            continue
            
        plotly_data = json.loads(plotly_json)
        
        # Export chart to PNG
        fig = go.Figure(plotly_data)
        img_bytes = to_image_safe(fig, format='png', width=600, height=300)
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        circle_num = i + 1
        radius = circle_request.get('radius', 0) * 1000  # m to mm
        html += f"""
        <h3>Kreis {circle_num} (Radius: {radius:.2f} mm)</h3>
        <div class="chart-container">
            <img src="data:image/png;base64,{img_base64}" alt="Kreis-Messung {circle_num}">
        </div>
"""
    
    html += """
    </div>
"""
    
    return html


def generate_zero_crossings_section(circle_data_list):
    """Generate HTML for zero crossings analysis."""
    if not circle_data_list or len(circle_data_list) == 0:
        return ""
    
    html = ""
    
    for i, circle_data in enumerate(circle_data_list):
        zero_crossings = circle_data.get('zeroCrossings')
        
        if not zero_crossings:
            continue
        
        circle_num = i + 1
        component = zero_crossings.get('component', 'Bz')
        poles = zero_crossings.get('poles', 0)
        crossings = zero_crossings.get('crossings', [])
        
        if html == "":
            html = """
    <div class="section">
        <h2>Nulldurchgangs-Analyse</h2>
"""
        
        html += f"""
        <h3>Kreis {circle_num} - {poles}-polige Magnetisierung ({component})</h3>
        <p>Abweichungen der gemessenen Nulldurchgänge von den theoretischen Sollwinkeln.</p>
        <table>
            <tr>
                <th>Nulldurchgang Nr.</th>
                <th>Sollwinkel (°)</th>
                <th>Ist-Winkel (°)</th>
                <th>Abweichung (°)</th>
            </tr>
"""
        
        for crossing in crossings:
            pole_index = crossing.get('poleIndex', 0)
            expected = crossing.get('expectedAngle', 0)
            measured = crossing.get('measuredAngle')
            deviation = crossing.get('deviationDegrees')
            
            measured_str = f"{measured:.2f}" if measured is not None else "—"
            deviation_str = f"{deviation:.3f}" if deviation is not None else "—"
            
            html += f"""
            <tr>
                <td class="mono">{pole_index}</td>
                <td class="mono">{expected:.2f}</td>
                <td class="mono">{measured_str}</td>
                <td class="mono">{deviation_str}</td>
            </tr>
"""
        
        html += """
        </table>
"""
    
    if html != "":
        html += """
    </div>
"""
    
    return html


def generate_visualization_section(viz_input):
    """Generate HTML for field visualization section."""
    if not viz_input:
        return ""
    
    # Placeholder - would need to implement field grid calculation
    html = """
    <div class="section">
        <h2>2D-Feldvisualisierung</h2>
        <p><em>Feldvisualisierung wird in einer zukünftigen Version hinzugefügt.</em></p>
    </div>
"""
    
    return html


def generate_documentation_section():
    """Generate HTML for technical documentation section."""
    html = """
    <div class="section page-break">
        <h2>Technische Dokumentation</h2>
        <p>Dieser Bericht wurde mit Magpylib v5.2.1 erstellt, einer Python-Bibliothek zur präzisen Berechnung magnetischer Felder von Permanentmagneten.</p>
        
        <h3>Berechnungsmethode</h3>
        <p>Die Berechnungen basieren auf analytischen Lösungen der magnetostatischen Gleichungen für verschiedene Magnetgeometrien. Die Feldstärke wird direkt am Berechnungspunkt ermittelt, ohne Näherungen für große Entfernungen.</p>
        
        <h3>Koordinatensystem</h3>
        <p>Das verwendete Koordinatensystem ist rechtshändig mit dem Ursprung im Magnetmittelpunkt. Bei axialer Magnetisierung zeigt der Nordpol in Richtung der positiven Z-Achse.</p>
        
        <h3>Genauigkeit</h3>
        <p>Die Berechnungen sind auch im Nahfeld (nahe der Magnetoberfläche) präzise. Die numerische Genauigkeit liegt typischerweise im Bereich von 10<sup>-6</sup> Tesla.</p>
    </div>
"""
    
    return html


def generate_report(report_request):
    """
    Generate PDF report from request data.
    
    Args:
        report_request: Dict with report configuration
        
    Returns:
        Dict with base64-encoded PDF and filename
    """
    try:
        # Generate HTML
        html_content = generate_html_template(report_request)
        
        # Convert HTML to PDF
        pdf_bytes = HTML(string=html_content).write_pdf()
        
        if pdf_bytes is None:
            raise Exception("PDF generation failed - write_pdf returned None")
        
        # Encode to base64
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"magnetfeld_bericht_{timestamp}.pdf"
        
        return {
            'pdfBase64': pdf_base64,
            'filename': filename
        }
    
    except Exception as e:
        return {
            'error': str(e)
        }


def main():
    """Main entry point - reads JSON from stdin, generates report, outputs JSON."""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        # Generate report
        result = generate_report(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        sys.stdout.flush()
    
    except Exception as e:
        error_result = {'error': str(e)}
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)


if __name__ == '__main__':
    main()
