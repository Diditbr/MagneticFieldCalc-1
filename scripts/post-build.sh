#!/bin/bash
# Post-build script to copy Python files to dist directory

echo "Copying Python files to dist directory..."
mkdir -p dist
mkdir -p dist/server

# Copy Python calculator files
cp server/magpylib_calculator.py dist/magpylib_calculator.py
cp server/magpylib_calculator.py dist/server/magpylib_calculator.py
cp server/report_generator.py dist/server/report_generator.py
cp server/documentation_generator.py dist/server/documentation_generator.py
cp server/plotly_viz.py dist/server/plotly_viz.py

echo "Python files copied successfully to dist/ and dist/server/!"
ls -lh dist/*.py dist/server/*.py 2>/dev/null || echo "Listing Python files..."
