#!/bin/bash
# Post-build script to copy Python files to dist directory

echo "Copying Python calculator to dist directory..."
mkdir -p dist
cp server/magpylib_calculator.py dist/magpylib_calculator.py
echo "Python files copied successfully!"
