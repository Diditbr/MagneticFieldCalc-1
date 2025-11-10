import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { ZodError } from "zod";
import { storage } from "./storage";
import {
  fieldCalculationRequestSchema,
  type FieldCalculationResponse,
  fieldGridRequestSchema,
  type FieldGridResponse,
  lineCalculationRequestSchema,
  type LineCalculationResponse,
  circleCalculationRequestSchema,
  type CircleCalculationResponse,
  reportRequestSchema,
  type ReportResponse,
} from "@shared/schema";
import { calculateFieldEnhanced } from "./calculations";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Call Python magpylib calculator for accurate magnetic field calculations
 */
async function calculateWithMagpylib(request: any): Promise<FieldCalculationResponse> {
  return new Promise((resolve, reject) => {
    // Find Python script - try multiple locations
    const possiblePaths = [
      join(__dirname, 'magpylib_calculator.py'),           // Development: server/
      join(__dirname, '..', 'server', 'magpylib_calculator.py'),  // Production: dist/ -> server/
      join(process.cwd(), 'server', 'magpylib_calculator.py'),    // Fallback: from project root
    ];
    
    let pythonScript = '';
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        pythonScript = path;
        break;
      }
    }
    
    if (!pythonScript) {
      reject(new Error(`Python script not found. Tried: ${possiblePaths.join(', ')}`));
      return;
    }
    
    const python = spawn('python3', [pythonScript]);
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    // Set timeout to prevent hanging (60 seconds for complex visualizations with many arrows)
    const timeout = setTimeout(() => {
      timedOut = true;
      python.kill();
      reject(new Error('Python calculation timed out after 60 seconds'));
    }, 60000);
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      clearTimeout(timeout);
      
      if (timedOut) {
        return;
      }
      
      if (code !== 0) {
        reject(new Error(`Python calculation failed: ${stderr || 'Unknown error'}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result as FieldCalculationResponse);
          }
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${e}`));
        }
      }
    });
    
    python.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
    
    // Send input data to Python script via stdin
    python.stdin.write(JSON.stringify(request));
    python.stdin.end();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Magnetic field calculation endpoint using Magpylib for accuracy
  app.post("/api/calculate", async (req, res) => {
    try {
      // Validate request body
      const validatedData = fieldCalculationRequestSchema.parse(req.body);
      
      try {
        // Try to calculate using Python/Magpylib for accurate near-field results
        const result: FieldCalculationResponse = await calculateWithMagpylib(validatedData);
        res.json(result);
        return;
      } catch (pythonError) {
        // If Python calculation fails, fall back to TypeScript implementation
        console.error('Magpylib calculation failed, falling back to dipole approximation:', pythonError);
        try {
          const fallbackResult: FieldCalculationResponse = calculateFieldEnhanced(validatedData);
          res.json(fallbackResult);
          return;
        } catch (fallbackError) {
          // Both calculation methods failed - this is a server error
          console.error('Both Magpylib and fallback calculation failed:', fallbackError);
          res.status(500).json({ error: 'Internal calculation error' });
          return;
        }
      }
    } catch (error) {
      // Validation errors are client errors (400)
      if (error instanceof ZodError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof Error) {
        // Other errors are server errors (500)
        console.error('Unexpected server error:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(500).json({ error: 'Unknown server error' });
      }
    }
  });

  // Field grid endpoint for visualization - samples B field across X-Z plane
  app.post("/api/field-grid", async (req, res) => {
    try {
      const validatedData = fieldGridRequestSchema.parse(req.body);
      
      // Build grid request for Python script
      const gridRequest = {
        ...validatedData,
        mode: 'grid', // Signal to Python script to return grid data
      };
      
      try {
        const result = await calculateWithMagpylib(gridRequest) as unknown as FieldGridResponse;
        res.json(result);
      } catch (error) {
        console.error('Grid calculation failed:', error);
        res.status(500).json({ error: 'Field grid calculation failed' });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Field visualization endpoint - generates matplotlib field line visualization
  app.post("/api/field-visualization", async (req, res) => {
    try {
      // Build visualization request for Python script
      const visualizationRequest = {
        ...req.body,
        mode: 'visualization', // Signal to Python script to return image
      };
      
      try {
        const result = await calculateWithMagpylib(visualizationRequest);
        res.json(result);
      } catch (error) {
        console.error('Visualization generation failed:', error);
        res.status(500).json({ error: 'Field visualization generation failed' });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Line calculation endpoint - calculates field along a line and generates chart
  app.post("/api/line-calculation", async (req, res) => {
    try {
      // Validate request body
      const validatedData = lineCalculationRequestSchema.parse(req.body);
      
      // Build line calculation request for Python script
      const lineRequest = {
        ...validatedData,
        mode: 'line', // Signal to Python script to calculate along line
      };
      
      try {
        const result = await calculateWithMagpylib(lineRequest) as unknown as LineCalculationResponse;
        res.json(result);
      } catch (error) {
        console.error('Line calculation failed:', error);
        res.status(500).json({ error: 'Line calculation failed' });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Circle calculation endpoint - calculates field along a circular path with cylindrical coordinates
  app.post("/api/circle-calculation", async (req, res) => {
    try {
      // Validate request body
      const validatedData = circleCalculationRequestSchema.parse(req.body);
      
      // Build circle calculation request for Python script
      const circleRequest = {
        ...validatedData,
        mode: 'circle', // Signal to Python script to calculate along circle
      };
      
      try {
        const result = await calculateWithMagpylib(circleRequest) as unknown as CircleCalculationResponse;
        res.json(result);
      } catch (error) {
        console.error('Circle calculation failed:', error);
        res.status(500).json({ error: 'Circle calculation failed' });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Documentation endpoint - returns flowcharts and LaTeX formulas for magnet calculations
  app.get("/api/documentation/:magnetType", async (req, res) => {
    try {
      const magnetType = req.params.magnetType;
      
      // Validate magnet type
      const validTypes = ['rectangular', 'cylindrical', 'ring', 'ring_segment', 'ring_multi_segment'];
      if (!validTypes.includes(magnetType)) {
        res.status(400).json({ error: `Invalid magnet type. Must be one of: ${validTypes.join(', ')}` });
        return;
      }
      
      // Find Python script
      const possiblePaths = [
        join(__dirname, 'documentation_generator.py'),
        join(__dirname, '..', 'server', 'documentation_generator.py'),
        join(process.cwd(), 'server', 'documentation_generator.py'),
      ];
      
      let pythonScript = '';
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          pythonScript = path;
          break;
        }
      }
      
      if (!pythonScript) {
        res.status(500).json({ error: 'Documentation generator not found' });
        return;
      }
      
      // Call Python documentation generator
      const python = spawn('python3', [pythonScript, magnetType]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Documentation generation failed:', stderr);
          res.status(500).json({ error: 'Documentation generation failed' });
        } else {
          try {
            const result = JSON.parse(stdout);
            res.json(result);
          } catch (e) {
            console.error('Failed to parse documentation output:', e);
            res.status(500).json({ error: 'Failed to parse documentation' });
          }
        }
      });
      
      python.on('error', (err) => {
        console.error('Failed to start documentation generator:', err);
        res.status(500).json({ error: 'Failed to generate documentation' });
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Report generation endpoint
  app.post("/api/report", async (req, res) => {
    try {
      // Validate request body
      const validatedData = reportRequestSchema.parse(req.body);
      
      // Debug: Log circle data to check if zeroCrossings2 is present
      if (validatedData.inputs?.circle && validatedData.inputs.circle.length > 0) {
        console.log('[DEBUG] Report circle data:', JSON.stringify({
          hasZeroCrossings: !!validatedData.inputs.circle[0].zeroCrossings,
          hasZeroCrossings2: !!validatedData.inputs.circle[0].zeroCrossings2,
          zeroCrossings2Sample: validatedData.inputs.circle[0].zeroCrossings2 ? 
            { component: validatedData.inputs.circle[0].zeroCrossings2.component, poles: validatedData.inputs.circle[0].zeroCrossings2.poles } : null
        }));
      }
      
      // Find Python script
      const possiblePaths = [
        join(__dirname, 'report_generator.py'),
        join(__dirname, '..', 'server', 'report_generator.py'),
        join(process.cwd(), 'server', 'report_generator.py'),
      ];
      
      let pythonScript = '';
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          pythonScript = path;
          break;
        }
      }
      
      if (!pythonScript) {
        res.status(500).json({ error: `Report generator not found. Tried: ${possiblePaths.join(', ')}` });
        return;
      }
      
      const python = spawn('python3', [pythonScript]);
      
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      
      // Set timeout to 120 seconds for report generation (PDF can be slow)
      const timeout = setTimeout(() => {
        timedOut = true;
        python.kill();
      }, 120000);
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        clearTimeout(timeout);
        
        if (timedOut) {
          res.status(504).json({ error: 'Report generation timed out after 120 seconds' });
          return;
        }
        
        if (code !== 0) {
          console.error('Report generation failed:', stderr);
          res.status(500).json({ error: `Report generation failed: ${stderr || 'Unknown error'}` });
        } else {
          try {
            const result = JSON.parse(stdout);
            if (result.error) {
              res.status(500).json({ error: result.error });
            } else {
              res.json(result as ReportResponse);
            }
          } catch (e) {
            console.error('Failed to parse report output:', e);
            res.status(500).json({ error: 'Failed to parse report output' });
          }
        }
      });
      
      python.on('error', (err) => {
        clearTimeout(timeout);
        console.error('Failed to start report generator:', err);
        res.status(500).json({ error: `Failed to start report generator: ${err.message}` });
      });
      
      // Send input data to Python script via stdin
      python.stdin.write(JSON.stringify(validatedData));
      python.stdin.end();
      
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
