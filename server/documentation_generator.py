"""
Documentation Generator for Magnetic Field Calculator
Generates flowcharts and LaTeX formulas for calculation methods.
"""

import latexify
import pyflowchart
import inspect
import numpy as np

def get_polarization_formula_latex(magnet_type: str, magnetization_type: str) -> str:
    """Generate LaTeX formulas for polarization calculations."""
    
    if magnetization_type == 'axial':
        if magnet_type in ['ring', 'ring_segment', 'ring_multi_segment']:
            return r"$\vec{p} = (0, 0, -M)$ \quad \text{(invertiert für CylinderSegment)}"
        else:
            return r"$\vec{p} = (0, 0, M)$"
    
    elif magnetization_type == 'diametral':
        return r"$\vec{p} = (M \cdot \cos(\alpha), 0, M \cdot \sin(\alpha))$ \quad \text{wobei } \alpha \text{ der Magnetisierungswinkel}"
    
    elif magnetization_type == 'radial':
        return r"$\vec{p} = (M \cdot \cos(\varphi_c), M \cdot \sin(\varphi_c), 0)$ \quad \text{wobei } \varphi_c = \frac{\varphi_1 + \varphi_2}{2}$"
    
    return ""


def get_coordinate_transform_latex() -> str:
    """Generate LaTeX for coordinate transformation."""
    return r"""
\textbf{Koordinatentransformation:}
\begin{align}
z_{\text{UI}} &= 0 \quad \text{(Magnetoberfläche)} \\
z_{\text{Magpylib}} &= z_{\text{UI}} + \frac{h}{2} \quad \text{(Magnetzentrum)} \\
\vec{r}_{\text{observer}} &= (x, y, z_{\text{Magpylib}})
\end{align}
"""


def get_field_calculation_latex() -> str:
    """Generate LaTeX for magnetic field calculation."""
    return r"""
\textbf{Magnetfeldberechnung:}
\begin{align}
\vec{B}(\vec{r}) &= \text{magpy.getB}(\text{magnet}, \vec{r}_{\text{observer}}) \\
|\vec{B}| &= \sqrt{B_x^2 + B_y^2 + B_z^2} \\
d &= |\vec{r}_{\text{observer}}| = \sqrt{x^2 + y^2 + z^2}
\end{align}
"""


def get_cylindrical_decomposition_latex() -> str:
    """Generate LaTeX for cylindrical coordinate decomposition."""
    return r"""
\textbf{Zerlegung in Zylinderkoordinaten:}
\begin{align}
B_r &= B_x \cdot \cos(\theta) + B_y \cdot \sin(\theta) \quad \text{(radial)} \\
B_t &= -B_x \cdot \sin(\theta) + B_y \cdot \cos(\theta) \quad \text{(tangential)} \\
B_z &= B_z \quad \text{(axial)}
\end{align}
\text{wobei } \theta \text{ der Winkel in der X-Y-Ebene}
"""


def get_multi_segment_formula_latex() -> str:
    """Generate LaTeX for multi-segment ring calculation."""
    return r"""
\textbf{Multi-Segment-Ring:}
\begin{align}
\text{Segment } i: \quad & \varphi_i = i \cdot \frac{360°}{n_{\text{poles}}} \\
\text{Polarisierung:} \quad & \vec{p}_i = M \cdot (\cos(\varphi_{c,i}), \sin(\varphi_{c,i}), 0) \cdot (-1)^i \\
\text{Gesamtfeld:} \quad & \vec{B}_{\text{total}} = \sum_{i=1}^{n} \vec{B}_i(\vec{r})
\end{align}
"""


def generate_flowchart_code(magnet_type: str) -> str:
    """
    Generate flowchart code for specific magnet calculation flow.
    Returns flowchart.js DSL code as string.
    """
    
    if magnet_type == 'rectangular':
        flowchart_dsl = """st=>start: Start Berechnung
input=>inputoutput: Eingabe: Länge, Breite, Höhe, Magnetisierung M
create=>operation: Erstelle Cuboid
polarization: (0, 0, M)
dimension: (l, w, h)
transform=>operation: Koordinatentransformation
z_magpylib = z_ui + h/2
calculate=>operation: Berechne Feld
B = magpy.getB(magnet, observer)
output=>inputoutput: Ausgabe: Bx, By, Bz, |B|
e=>end: Ende

st->input->create->transform->calculate->output->e"""
    
    elif magnet_type == 'cylindrical':
        flowchart_dsl = """st=>start: Start Berechnung
input=>inputoutput: Eingabe: Durchmesser, Länge, Magnetisierung M
check_type=>condition: Magnetisierungstyp?
axial=>operation: Axial:
p = (0, 0, M)
diametral=>operation: Diametral:
p = (M·cos(α), 0, M·sin(α))
create=>operation: Erstelle Cylinder
polarization: p
dimension: (d, l)
tilt=>condition: Achsenneigung?
apply_tilt=>operation: Rotation um Y-Achse
angle: axisTiltAngle
transform=>operation: Koordinatentransformation
z_magpylib = z_ui + l/2
calculate=>operation: Berechne Feld
B = magpy.getB(magnet, observer)
output=>inputoutput: Ausgabe: Bx, By, Bz, |B|
e=>end: Ende

st->input->check_type
check_type(yes)->axial->create
check_type(no)->diametral->create
create->tilt
tilt(yes)->apply_tilt->transform
tilt(no)->transform
transform->calculate->output->e"""
    
    elif magnet_type == 'ring':
        flowchart_dsl = """st=>start: Start Berechnung
input=>inputoutput: Eingabe: d_außen, d_innen, Dicke, Magnetisierung M
check_type=>condition: Magnetisierungstyp?
axial=>operation: Axial:
p = (0, 0, -M)
diametral=>operation: Diametral:
p = (M·cos(α), 0, M·sin(α))
create=>operation: Erstelle CylinderSegment
polarization: p
dimension: (r_i, r_a, h, 0°, 360°)
tilt=>condition: Achsenneigung?
apply_tilt=>operation: Rotation um Y-Achse
angle: axisTiltAngle
transform=>operation: Koordinatentransformation
z_magpylib = z_ui + h/2
calculate=>operation: Berechne Feld
B = magpy.getB(magnet, observer)
output=>inputoutput: Ausgabe: Bx, By, Bz, |B|
e=>end: Ende

st->input->check_type
check_type(yes)->axial->create
check_type(no)->diametral->create
create->tilt
tilt(yes)->apply_tilt->transform
tilt(no)->transform
transform->calculate->output->e"""
    
    elif magnet_type == 'ring_segment':
        flowchart_dsl = """st=>start: Start Berechnung
input=>inputoutput: Eingabe: d_außen, d_innen, Dicke, φ₁, φ₂, Magnetisierung M
check_type=>condition: Magnetisierungstyp?
axial=>operation: Axial:
p = (0, 0, -M)
diametral=>operation: Diametral:
p = (M·cos(α), 0, M·sin(α))
radial=>operation: Radial:
φ_c = (φ₁+φ₂)/2
p = (M·cos(φ_c), M·sin(φ_c), 0)
check_radial=>condition: Radial?
discretize=>operation: Diskretisiere in
n = max(4, Δφ/15°) Segmente
create=>operation: Erstelle CylinderSegment
polarization: p
dimension: (r_i, r_a, h, φ₁, φ₂)
transform=>operation: Koordinatentransformation
z_magpylib = z_ui + h/2
calculate=>operation: Berechne Feld
B = magpy.getB(magnet, observer)
output=>inputoutput: Ausgabe: Bx, By, Bz, |B|
e=>end: Ende

st->input->check_type
check_type(yes, left)->axial->create
check_type(no)->diametral->check_radial
check_radial(yes)->radial->discretize->create
check_radial(no)->create
create->transform->calculate->output->e"""
    
    elif magnet_type == 'ring_multi_segment':
        flowchart_dsl = """st=>start: Start Berechnung
input=>inputoutput: Eingabe: d_außen, d_innen, Dicke, n_poles, Magnetisierung M
segments=>operation: Erzeuge n_poles Segmente
φ_i = i · (360°/n_poles)
loop=>operation: Für jedes Segment i:
φ_center = (φ_i + φ_{i+1})/2
calc_pol=>operation: Berechne Polarisierung:
p_i = M·(cos(φ_c), sin(φ_c), 0)·(-1)^i
create_seg=>operation: Erstelle CylinderSegment
dimension: (r_i, r_a, h, φ_i, φ_{i+1})
collection=>operation: Sammle alle Segmente
in magpy.Collection
transform=>operation: Koordinatentransformation
z_magpylib = z_ui + h/2
calculate=>operation: Berechne Gesamtfeld
B_total = Σ B_i(observer)
output=>inputoutput: Ausgabe: Bx, By, Bz, |B|
e=>end: Ende

st->input->segments->loop->calc_pol->create_seg->collection->transform->calculate->output->e"""
    
    else:
        flowchart_dsl = """st=>start: Start
e=>end: Ende
st->e"""
    
    return flowchart_dsl


def generate_documentation(magnet_type: str):
    """
    Generate complete documentation for a magnet type.
    Returns dict with flowchart DSL code and LaTeX formulas.
    """
    
    # Generate flowchart
    flowchart_code = generate_flowchart_code(magnet_type)
    
    # Generate formulas
    formulas = {
        'polarization_axial': get_polarization_formula_latex(magnet_type, 'axial'),
        'polarization_diametral': get_polarization_formula_latex(magnet_type, 'diametral'),
        'polarization_radial': get_polarization_formula_latex(magnet_type, 'radial'),
        'coordinate_transform': get_coordinate_transform_latex(),
        'field_calculation': get_field_calculation_latex(),
        'cylindrical_decomposition': get_cylindrical_decomposition_latex(),
    }
    
    # Add multi-segment formula for ring_multi_segment type
    if magnet_type == 'ring_multi_segment':
        formulas['multi_segment'] = get_multi_segment_formula_latex()
    
    return {
        'flowchart': flowchart_code,
        'formulas': formulas,
        'magnet_type': magnet_type
    }


if __name__ == "__main__":
    import sys
    import json
    
    # Check if magnet type is provided as command line argument
    if len(sys.argv) > 1:
        magnet_type = sys.argv[1]
        
        # Validate magnet type
        valid_types = ['rectangular', 'cylindrical', 'ring', 'ring_segment', 'ring_multi_segment']
        if magnet_type not in valid_types:
            error_response = {
                'error': f'Invalid magnet type: {magnet_type}. Must be one of: {", ".join(valid_types)}'
            }
            print(json.dumps(error_response, ensure_ascii=False))
            sys.exit(1)
        
        try:
            doc = generate_documentation(magnet_type)
            # Output as JSON for API consumption
            print(json.dumps(doc, ensure_ascii=False))
            sys.exit(0)
        except Exception as e:
            error_response = {
                'error': f'Documentation generation failed: {str(e)}'
            }
            print(json.dumps(error_response, ensure_ascii=False))
            sys.exit(1)
    else:
        # Test documentation generation for all types
        for magnet_type in ['rectangular', 'cylindrical', 'ring', 'ring_segment', 'ring_multi_segment']:
            doc = generate_documentation(magnet_type)
            print(f"\n=== Documentation for {magnet_type} ===")
            print("\nFlowchart DSL:")
            print(doc['flowchart'])
            print("\nFormulas:")
            for key, formula in doc['formulas'].items():
                if formula:
                    print(f"{key}: {formula}")
