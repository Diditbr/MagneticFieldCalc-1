# Magnetic Field Calculator - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Material Design-inspired)
**Justification:** Scientific calculator requiring clarity, precision, and efficient data input/output. Focuses on functionality, readability, and structured information hierarchy.

**Core Principles:**
- Clarity over decoration - information must be instantly scannable
- Progressive disclosure - reveal complexity as needed
- Visual hierarchy through typography and spacing, not visual effects
- Grid-based precision reflecting the mathematical nature of the tool

---

## Typography System

**Font Family:** 
- Primary: 'Inter' (Google Fonts) - UI elements, labels, body text
- Monospace: 'JetBrains Mono' (Google Fonts) - numerical values, formulas, calculations

**Type Scale:**
- H1: text-4xl font-bold (page title)
- H2: text-2xl font-semibold (section headers: "Magnet Configuration", "Field Results")
- H3: text-lg font-semibold (subsection headers, parameter groups)
- Body: text-base (descriptions, explanations)
- Labels: text-sm font-medium (form labels, units)
- Values: text-lg font-mono (calculation results, inputs)
- Captions: text-xs (helper text, formulas)

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Element margins: mb-2, mb-4, mb-6

**Grid Structure:**
- Desktop: Two-column layout (lg:grid-cols-2) - inputs left, visualization/results right
- Tablet: Single column with stacked sections (md:grid-cols-1)
- Mobile: Full-width single column with generous spacing

**Container Widths:**
- Main container: max-w-7xl mx-auto px-4
- Form sections: Full width within grid
- Result cards: Full width with internal padding

---

## Component Library

### 1. Input Forms
**Magnet Type Selector:**
- Radio button group or segmented control
- Options: Bar Magnet, Cylindrical, Rectangular, Ring Magnet
- Large touch targets (h-12), icons from Heroicons library
- Active state clearly distinguished

**Parameter Input Fields:**
- Grouped by category (Dimensions, Material Properties, Position)
- Numeric inputs with unit dropdowns inline (flex layout)
- Labels above inputs (text-sm font-medium mb-2)
- Input fields: h-10, rounded-md, border with focus states
- Helper text below inputs explaining each parameter
- Validation feedback inline

**Material Presets:**
- Dropdown select with common materials
- List items show: Material name + typical strength value
- "Custom" option allows manual magnetization input

### 2. Calculation Controls
**Calculate Button:**
- Primary action button, prominent placement
- w-full on mobile, auto-width on desktop
- h-12, rounded-md
- Icon: Calculator icon from Heroicons

**Unit Conversion Toggles:**
- Segmented control for field units (T, mT, G, kG)
- Segmented control for distance units (mm, cm, m, in)
- Compact, text-sm

### 3. Results Display
**Field Magnitude Card:**
- Large, prominent display of total field strength
- text-4xl font-mono for value
- Unit displayed adjacent (text-xl)
- Card with rounded-lg, p-6

**Component Breakdown:**
- Three-column grid (grid-cols-3 gap-4)
- Individual cards for Bx, By, Bz components
- Value + direction indicator
- text-2xl font-mono for values

**Distance/Position Display:**
- Shows calculation point coordinates
- Compact, text-sm, above field results

### 4. Visualization Panel
**Magnetic Field Visualization:**
- Canvas/SVG area for field line representation
- Min height: h-96 on desktop, h-64 on mobile
- Border with rounded corners
- Field lines drawn programmatically using canvas API
- Legend showing field strength gradient
- Toggle controls: "Show Field Lines", "Show Vectors", "Show Magnet"

**Coordinate System Indicator:**
- Small reference axes in corner of visualization
- Labels: X, Y, Z with directional arrows

### 5. Formula Display
**Expandable Formula Section:**
- Collapsible panel showing relevant equations
- LaTeX-style formatting using HTML/CSS
- Variables explained with definitions
- Small, educational, positioned below main calculator
- Background treatment to distinguish from main content

### 6. Educational Tooltips
- Question mark icons (Heroicons) next to complex parameters
- Hover/click reveals explanation
- Concise, helpful descriptions (max 2 sentences)

---

## Navigation & Header

**Header:**
- Fixed or sticky top bar (h-16)
- Logo/title: "Magnetic Field Calculator" (text-xl font-bold)
- Navigation links: "Calculator" | "About" | "Documentation" (text-sm)
- Horizontal layout with space-between

**Footer:**
- Minimal, text-center
- Links to formulas, references, GitHub
- text-sm, py-8

---

## Responsive Behavior

**Desktop (lg:):**
- Two-column layout: inputs | visualization/results
- Side-by-side comparison of input and output
- Formula section spans full width below

**Tablet (md:):**
- Single column, larger touch targets
- Visualization full-width between inputs and results
- Maintain all functionality

**Mobile:**
- Stack all sections vertically
- Full-width inputs and results
- Visualization height reduced to h-64
- Larger tap targets (min-h-12)

---

## Images

**No hero image.** This is a utility application where users come directly to calculate. Instead:
- Optional: Small icon/graphic of magnet shapes in header area as decorative element
- Visualization canvas is the primary visual element
- Diagrams showing magnet dimensions inline with parameter inputs (optional, small, labeled)

---

## Accessibility

- All form inputs have associated labels
- Error states clearly marked with text + visual indicators
- Focus states prominent on all interactive elements
- Keyboard navigation fully supported
- ARIA labels on icon-only buttons
- High contrast maintained throughout
- Number inputs with appropriate step values and min/max

---

## Content Strategy

**Progressive Disclosure:**
- Default view: Common magnet type (Bar magnet) pre-selected with basic parameters
- Advanced options collapsed initially
- "Show Formula" as expandable section, not default visible
- Material presets reduce cognitive load for beginners

**Helpful Context:**
- Inline explanations for each parameter
- Example values/typical ranges shown
- Unit conversions happen automatically
- Clear labeling of coordinate system and measurement points