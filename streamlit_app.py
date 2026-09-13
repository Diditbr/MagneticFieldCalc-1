"""Streamlit interface for the magnetic field calculator."""

import io
import json
from contextlib import redirect_stdout

import plotly.graph_objects as go
import streamlit as st

from server.magpylib_calculator import (
    calculate_circle_field,
    calculate_field,
    calculate_line_field,
)


MAGNET_TYPES = {
    "Rectangular magnet": "rectangular",
    "Cylindrical magnet": "cylindrical",
    "Ring magnet": "ring",
    "Ring segment": "ring_segment",
}


def mm_to_m(value: float) -> float:
    return value / 1000


def plotly_result(result: dict) -> None:
    figure = go.Figure(json.loads(result["plotlyJson"]))
    figure.update_layout(
        autosize=True,
        height=480,
        margin=dict(l=10, r=10, t=55, b=10),
    )
    st.plotly_chart(figure, use_container_width=True)


def build_magnet_config() -> dict:
    magnet_type = MAGNET_TYPES[st.selectbox("Magnet type", list(MAGNET_TYPES))]
    magnetization = st.number_input(
        "Magnetization [T]", min_value=0.0, value=0.22, step=0.01, format="%.4f"
    )

    config = {
        "type": magnet_type,
        "magnetization": magnetization,
        "magnetizationType": "axial",
    }

    if magnet_type == "rectangular":
        length, width, height = st.columns(3)
        config["length"] = mm_to_m(
            length.number_input("Length [mm]", min_value=0.01, value=10.0)
        )
        config["width"] = mm_to_m(
            width.number_input("Width [mm]", min_value=0.01, value=5.0)
        )
        config["height"] = mm_to_m(
            height.number_input("Height [mm]", min_value=0.01, value=2.0)
        )
    elif magnet_type == "cylindrical":
        diameter, length = st.columns(2)
        config["diameter"] = mm_to_m(
            diameter.number_input("Diameter [mm]", min_value=0.01, value=20.0)
        )
        config["length"] = mm_to_m(
            length.number_input("Length [mm]", min_value=0.01, value=5.0)
        )
        config["magnetizationType"] = st.selectbox(
            "Magnetization", ["axial", "diametral"]
        )
        if config["magnetizationType"] == "diametral":
            config["magnetizationAngle"] = st.number_input(
                "Magnetization angle [deg]", value=0.0, step=5.0
            )
    else:
        diameter, inner_diameter, thickness = st.columns(3)
        config["diameter"] = mm_to_m(
            diameter.number_input("Outer diameter [mm]", min_value=0.01, value=20.0)
        )
        config["innerDiameter"] = mm_to_m(
            inner_diameter.number_input("Inner diameter [mm]", min_value=0.0, value=10.0)
        )
        config["thickness"] = mm_to_m(
            thickness.number_input("Thickness [mm]", min_value=0.01, value=5.0)
        )
        if magnet_type == "ring_segment":
            phi1, phi2 = st.columns(2)
            config["phi1"] = phi1.number_input("Start angle [deg]", value=0.0)
            config["phi2"] = phi2.number_input("End angle [deg]", value=90.0)
            config["magnetizationType"] = st.selectbox(
                "Magnetization", ["axial", "diametral", "radial"]
            )
        else:
            config["magnetizationType"] = st.selectbox(
                "Magnetization", ["axial", "diametral"]
            )
        if config["magnetizationType"] == "diametral":
            config["magnetizationAngle"] = st.number_input(
                "Magnetization angle [deg]", value=0.0, step=5.0
            )

    return config


def main() -> None:
    st.set_page_config(page_title="Magnetic Field Calculator", page_icon="M", layout="wide")
    st.markdown(
        """
        <style>
        .block-container { max-width: 1400px; padding-top: 2rem; }
        [data-testid="stMetric"] { background: #f7f9fb; border: 1px solid #e3e8ee;
            border-radius: 8px; padding: 0.8rem; }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.title("Magnetic Field Calculator")
    st.caption("Calculate the magnetic field of common magnet geometries")

    with st.sidebar:
        st.markdown("### About")
        st.caption("Powered by the existing Magpylib calculation engine.")
        st.divider()
        st.caption("All dimensions are entered in millimeters. The calculation uses SI units internally.")

    with st.container(border=True):
        st.subheader("Magnet setup")
        magnet_config = build_magnet_config()

    point_tab, line_tab, circle_tab = st.tabs(["Point field", "Line calculation", "Circle calculation"])

    with point_tab:
        input_column, result_column = st.columns([0.8, 1.5], gap="large")
        with input_column:
            st.subheader("Observation point")
            point_x, point_y, point_z = st.columns(3)
            x = mm_to_m(point_x.number_input("X [mm]", value=0.0, key="point_x"))
            y = mm_to_m(point_y.number_input("Y [mm]", value=0.0, key="point_y"))
            z = mm_to_m(point_z.number_input("Z [mm]", value=1.0, key="point_z"))
            calculate = st.button("Calculate field", type="primary", use_container_width=True)

        if calculate:
            try:
                result = calculate_field({**magnet_config, "x": x, "y": y, "z": z})
                with result_column:
                    st.subheader("Result")
                    result_columns = st.columns(5)
                    result_columns[0].metric("Bx", f"{result['Bx']:.6g} T")
                    result_columns[1].metric("By", f"{result['By']:.6g} T")
                    result_columns[2].metric("Bz", f"{result['Bz']:.6g} T")
                    result_columns[3].metric("|B|", f"{result['magnitude']:.6g} T")
                    result_columns[4].metric("Distance", f"{result['distance'] * 1000:.4g} mm")
                    figure = go.Figure(
                        go.Bar(
                            x=["Bx", "By", "Bz"],
                            y=[result["Bx"], result["By"], result["Bz"]],
                            marker_color=["#2878b5", "#59a14f", "#e15759"],
                        )
                    )
                    figure.update_layout(
                        title="Field components",
                        yaxis_title="Magnetic flux density [T]",
                        margin=dict(l=10, r=10, t=55, b=10),
                        height=380,
                    )
                    st.plotly_chart(figure, use_container_width=True)
            except Exception as error:
                with result_column:
                    st.error(f"Calculation failed: {error}")
        else:
            st.info("Set the observation point and start a calculation.")

    with line_tab:
        line_input, line_result = st.columns([0.8, 1.5], gap="large")
        with line_input:
            st.subheader("Line parameters")
            st.caption("The field is sampled between the start and end point.")
            start = st.columns(3)
            end = st.columns(3)
            start_values = [mm_to_m(column.number_input(f"Start {axis} [mm]", value=value, key=f"line_start_{axis}"))
                            for column, axis, value in zip(start, ("X", "Y", "Z"), (0.0, 0.0, 0.0))]
            end_values = [mm_to_m(column.number_input(f"End {axis} [mm]", value=value, key=f"line_end_{axis}"))
                          for column, axis, value in zip(end, ("X", "Y", "Z"), (0.0, 0.0, 5.0))]
            num_points = st.number_input("Sample points", min_value=10, max_value=200, value=100, step=10)
            calculate_line = st.button("Calculate along line", type="primary", use_container_width=True)

        if calculate_line:
            line_request = {
                **magnet_config,
                "startX": start_values[0], "startY": start_values[1], "startZ": start_values[2],
                "endX": end_values[0], "endY": end_values[1], "endZ": end_values[2],
                "numPoints": int(num_points),
            }
            try:
                with line_result:
                    st.subheader("Line result")
                    plotly_result(calculate_line_field(line_request))
            except Exception as error:
                with line_result:
                    st.error(f"Line calculation failed: {error}")
        else:
            st.info("Define a start and end point, then start the line calculation.")

    with circle_tab:
        circle_input, circle_result = st.columns([0.8, 1.5], gap="large")
        with circle_input:
            st.subheader("Circle parameters")
            radius = mm_to_m(st.number_input("Radius [mm]", min_value=0.01, value=11.0))
            center = st.columns(3)
            center_values = [mm_to_m(column.number_input(f"Center {axis} [mm]", value=0.0, key=f"circle_center_{axis}"))
                             for column, axis in zip(center, ("X", "Y", "Z"))]
            samples = st.number_input("Sample points", min_value=36, max_value=1440, value=360, step=36)
            calculate_circle = st.button("Calculate along circle", type="primary", use_container_width=True)

        if calculate_circle:
            circle_request = {
                **magnet_config,
                "radius": radius,
                "centerX": center_values[0], "centerY": center_values[1], "centerZ": center_values[2],
                "numSamples": int(samples),
            }
            try:
                with circle_result:
                    st.subheader("Circle result")
                    # The calculator logs diagnostics to stdout; keep the Streamlit page clean.
                    with redirect_stdout(io.StringIO()):
                        circle_result_data = calculate_circle_field(circle_request)
                    plotly_result(circle_result_data)
            except Exception as error:
                with circle_result:
                    st.error(f"Circle calculation failed: {error}")
        else:
            st.info("Set the circle radius and center, then start the circle calculation.")


if __name__ == "__main__":
    main()