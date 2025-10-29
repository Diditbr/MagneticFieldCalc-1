import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  fieldCalculationRequestSchema,
  type FieldCalculationResponse,
} from "@shared/schema";
import { calculateFieldEnhanced } from "./calculations";

export async function registerRoutes(app: Express): Promise<Server> {
  // Magnetic field calculation endpoint
  app.post("/api/calculate", async (req, res) => {
    try {
      // Validate request body
      const validatedData = fieldCalculationRequestSchema.parse(req.body);
      
      // Calculate the magnetic field
      const result: FieldCalculationResponse = calculateFieldEnhanced(validatedData);
      
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid request" });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
