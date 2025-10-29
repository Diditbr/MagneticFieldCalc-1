# Magnetic Field Calculator

## Overview

A web-based scientific calculator for computing magnetic field strength from permanent magnets. The application supports multiple magnet geometries (bar, cylindrical, rectangular, and ring magnets) with material presets and real-time field calculations. Built as a full-stack application with a React frontend and Express backend, it provides an educational and practical tool for understanding magnetic field distributions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast refresh and optimized builds
- Wouter for lightweight client-side routing (single-page application)

**UI Component System**
- Shadcn/ui component library with Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Material Design-inspired design system focusing on clarity and precision (documented in design_guidelines.md)
- Typography: Inter for UI text, JetBrains Mono for numerical values and calculations
- Responsive grid layouts: two-column desktop (inputs left, visualization right), single-column mobile

**State Management**
- TanStack Query (React Query) for server state management and API caching
- Local component state for form inputs and UI interactions
- No global state management library - leverages React Query for data synchronization

**Form Handling**
- React Hook Form with Zod resolvers for type-safe form validation
- Real-time input validation matching backend schema definitions
- Unit conversion utilities for length (mm, cm, m, in) and field strength (T, mT, G, kG)

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the REST API
- ESM module system for modern JavaScript features
- Custom middleware for request logging and JSON body parsing

**API Design**
- RESTful endpoint structure with `/api/calculate` as primary calculation endpoint
- Request validation using Zod schemas shared between frontend and backend
- JSON request/response format with error handling

**Calculation Engine**
- Physics-based magnetic field calculations using magnetic dipole approximation
- Supports four magnet geometries with geometry-specific volume calculations
- Converts magnetization from Tesla (remanent field) to A/m for calculations
- Uses permeability of free space constant (μ₀ = 4π × 10⁻⁷ T·m/A)

**Data Validation**
- Shared Zod schemas (`shared/schema.ts`) ensure type safety across frontend and backend
- Validates magnet type, dimensions, material properties, and calculation coordinates
- Type inference from Zod schemas provides compile-time type checking

### Data Storage Solutions

**Current Implementation**
- In-memory storage using a Map-based storage class (`MemStorage`)
- User entity structure defined but not actively used for the calculator functionality
- No persistent database currently utilized for calculation results

**Database Configuration**
- Drizzle ORM configured for PostgreSQL with Neon Database serverless driver
- Schema definitions in `shared/schema.ts` ready for migration
- Migration system configured via `drizzle.config.ts` with migrations output to `/migrations`

**Rationale for Memory Storage**
The calculator performs stateless calculations - each request is independent and doesn't require data persistence. The in-memory storage provides user management capabilities if authentication features are added later.

### External Dependencies

**Third-Party Services**
- Neon Database: Serverless PostgreSQL provider (configured but not currently active)
- Google Fonts: Inter and JetBrains Mono font families

**UI Libraries**
- Radix UI: Comprehensive collection of unstyled, accessible UI primitives (accordion, dialog, dropdown, select, slider, tabs, tooltip, etc.)
- Lucide React: Icon library for consistent iconography
- Embla Carousel: Touch-friendly carousel component
- CMDK: Command palette component library

**Development Tools**
- Replit-specific plugins: runtime error overlay, cartographer for navigation, dev banner
- TypeScript for static type checking across the entire codebase
- ESBuild for production builds with tree-shaking and bundling

**Styling & Utilities**
- Class Variance Authority (CVA): Type-safe variant management for component styles
- clsx & tailwind-merge: Utility for conditional className composition
- Date-fns: Date manipulation (available but not actively used in calculator)

**Key Integration Points**
- No external calculation APIs - all physics computations performed server-side
- No authentication providers - application is publicly accessible
- No analytics or monitoring services integrated
- Canvas API for field visualization rendering