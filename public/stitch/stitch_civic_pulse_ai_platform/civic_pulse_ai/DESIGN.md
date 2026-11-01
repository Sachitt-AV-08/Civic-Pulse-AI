---
name: Civic Pulse AI
colors:
  surface: '#f6faff'
  surface-dim: '#d5dbe2'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4fb'
  surface-container: '#e9eef5'
  surface-container-high: '#e3e9f0'
  surface-container-highest: '#dde3ea'
  on-surface: '#161c21'
  on-surface-variant: '#43474d'
  inverse-surface: '#2b3136'
  inverse-on-surface: '#ecf1f8'
  outline: '#74777e'
  outline-variant: '#c3c6cd'
  surface-tint: '#49607a'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#011d34'
  on-primary-container: '#6e86a2'
  inverse-primary: '#b0c9e7'
  secondary: '#0259c5'
  on-secondary: '#ffffff'
  secondary-container: '#5790ff'
  on-secondary-container: '#002963'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#341100'
  on-tertiary-container: '#d95f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#b0c9e7'
  on-primary-fixed: '#011d34'
  on-primary-fixed-variant: '#314962'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#afc6ff'
  on-secondary-fixed: '#001a43'
  on-secondary-fixed-variant: '#004397'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f6faff'
  on-background: '#161c21'
  surface-variant: '#dde3ea'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  tabular-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  tabular-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system embodies an institutional, authoritative, yet approachable public service aesthetic tailored for mission-critical municipal operations, emergency routing, and AI-driven municipal triage. It bridges high-stakes data density with civic legibility, balancing democratic transparency and modern algorithmic speed.

### Aesthetics & Tone
- **Institutional Authority:** Grounded, unyielding, and measured. The platform evokes the reliability of municipal architecture translated to digital space.
- **Calm Under Pressure:** In rapid-response triage environments, visual noise is systematically stripped away. White space, balanced structural boundaries, and cool slate tones neutralize operator fatigue.
- **High-Credibility AI:** AI triage suggestions and automated telemetry are never treated as playful novelties. They are framed with forensic precision, transparent audit trails, confidence scoring badges, and strict provenance indicators.
- **Design Philosophy:** Modern Institutional Minimalist. Clean structural grids, delicate functional borders, controlled data density, and WCAG AAA-compliant high-contrast pairings deliver immediate readability across varying field and operations center conditions.

## Colors

The color architecture is built to withstand high-volume operational scrutiny. Strict contrast ratios exceed WCAG AAA standards across body text, tabular data, and status indicators.

### Key Roles & Assignments
- **Primary (`#001C33` - Deep Civic Navy):** Anchors navigation surfaces, high-level headers, primary key actions, and terminal structural boundaries. It establishes bedrock civic trust.
- **Secondary (`#0159C5` - Cobalt Public Service):** Highlights interactive focus elements, active navigation states, verified dispatch triggers, and primary hyperlinks.
- **Tertiary (`#F97316` - Operational Amber/Triage Orange):** Reserved strictly for critical municipal triage escalations, time-sensitive incident queue counts, and pending dispatch anomalies.
- **Semantic Incident Red (`#BA1A1A`):** Hard stop errors, emergency dispatch escalations, civic infrastructure failures, and life-safety priority flags.
- **Neutral Canvas (`#F8F9FF` - Clean Civic Tint):** Provides a crisp, daylight-calibrated surface tint that differentiates content containers without straining operator vision.
- **Structural Neutral (`#5A6066` / `#E2E8F0`):** Drives secondary data labels, subtle field borders, and divider rules.

### Systematic Application Rules
- Never use `#F97316` or `#BA1A1A` for decorative flair. Urgent colors must strictly correspond to SLA degradation or incident priority levels (P1/P2).
- AI triage confidence badges leverage soft-tinted backgrounds (e.g., `#EBF3FC`) paired with deep secondary accents (`#0159C5`) to distinguish automated recommendations from human-verified dispatches.

## Typography

The typographic hierarchy implements an intentional division of labor: **Plus Jakarta Sans** introduces warmth, civic clarity, and contemporary executive presence to editorial headings and incident summaries, while **Inter** delivers neutral, highly legible precision for incident logs, tables, telemetry, and interactive controls.

### Implementation Guidelines
- **Tabular Figures:** All tables, triage SLA timers, GPS coordinate displays, and civic metrics must enforce `font-feature-settings: "tnum" 1, "lnum" 1` via Inter to prevent visual jitter during real-time data streaming.
- **Labels & Micro-data:** Operational badge typography uses `label-sm` or `label-md` with uppercase styling and positive tracking to maximize rapid glanceability under stress.
- **Mobile Scale Strategy:** Any headline exceeding 24px steps down gracefully on screens under 768px to ensure complex civic incident titles never break into unreadable vertical stacks.

## Layout & Spacing

The platform is constructed on a rigorous, mathematically unified 8px dimensional grid (with a 4px half-step for micro-alignments, inputs, and inline chips).

### Grid Structure
- **Desktop (1280px+):** 12-column layout with 24px (`1.5rem`) gutters and 40px (`2.5rem`) outer canvas margins. Triage sidebars occupy a fixed 380px or 4-column span, preserving an 8-column workspace for dispatch logs and maps.
- **Tablet (768px - 1279px):** 8-column layout with 16px (`1rem`) gutters and 24px (`1.5rem`) margins. Left operational panels collapse into accessible drawer surfaces.
- **Mobile (<768px):** 4-column layout with 16px (`1rem`) gutters and 16px (`1rem`) margins. Triage queues stack into continuous linear priority feeds with sticky operational command bars.

### Rhythmic Discipline
Component internal padding strictly maps to `space-xs` (4px), `space-sm` (8px), `space-md` (16px), and `space-lg` (24px). Compact views in incident tables leverage `space-xs` vertically and `space-sm` horizontally to achieve maximum operational density without compromising touch targets (minimum 44x44px for primary interactions).

## Elevation & Depth

To preserve institutional authority and reduce visual distraction during emergency workflows, the design system minimizes deep ambient shadows in favor of a **Tonal Surface Hierarchy** backed by crisp, low-contrast structural outlines.

### Surface Elevation Tiers
1. **Canvas Base (`#F8F9FF`):** The primary municipal operating environment.
2. **Surface Level 1 (`#FFFFFF`):** High-priority operational cards, active incident logs, and data grid rows. Bordered with a subtle `1px solid #E2E8F0` rule.
3. **Surface Level 2 (Elevated Panels):** Hovered data rows, floating action bars, and slide-out triage panels. Outlined with `1px solid #CBD5E1` and lifted by an ultra-subtle ambient shadow: `0 2px 8px -2px rgba(0, 28, 51, 0.06), 0 1px 3px -1px rgba(0, 28, 51, 0.04)`.
4. **Surface Level 3 (Modal / Critical Alert Dialogs):** Reserved for destructive overrides, emergency broadcasts, and high-consequence AI routing approvals. Framed by a distinct `1px solid #94A3B8` border and accompanied by `0 12px 32px -4px rgba(0, 28, 51, 0.16)`.

### Optical Boundaries
Glassmorphism, frosted overlays, and skeuomorphic gradients are strictly avoided. Depth is communicated strictly through surface brightness steps and precise 1px hairline separators.

## Shapes

The design system enforces a **Soft Structural Geometry (`roundedness: 1`)**. Rounded corners are kept controlled and disciplined: standard component corners use 4px (`0.25rem`), cards and modal containers use 8px (`0.5rem`), and operational status tags maintain 4px to reinforce a modern, utilitarian aesthetic. 

### Geometric Rationale
- Completely sharp corners (`0px`) evoke legacy municipal software; hyper-rounded or pill shapes (`16px+`) undermine official weight and reduce internal canvas area for dense data tables.
- A controlled 4px/8px radius provides a contemporary, humanized feel while retaining clean tabular grid alignments and strict rectangular discipline.

## Components

### Buttons
- **Primary:** Filled with Primary Navy (`#001C33`), text in pure `#FFFFFF`. Height: 40px (desktop), padding: `0 16px`, radius: 4px. Focus state: `2px solid #0159C5` offset by 2px.
- **Secondary:** Outlined `1px solid #CBD5E1` with background `#FFFFFF` and text `#001C33`. Hover: background `#F1F5F9`.
- **Urgent Action / Escalation:** Filled with `#F97316` or `#BA1A1A` with `#FFFFFF` text. Used exclusively for incident escalation and emergency dispatch triggers.

### Operational Badges & AI Confidence Indicators
- **AI Triage Badge:** Structured pill containing AI model label + confidence metric (e.g., `AI 98%`). Background: `#EBF3FC`, text: `#0159C5`, border: `1px solid #BFDBFE`.
- **Urgent / P1 Priority Badge:** Background: `#FFF7ED`, text: `#C2410C`, border: `1px solid #FFEDD5`. Bold uppercase indicator dot: 6px solid `#F97316`.
- **Critical / Life-Safety Badge:** Background: `#FEF2F2`, text: `#991B1B`, border: `1px solid #FEE2E2`. Includes high-contrast icon glyph.
- **Resolved / Normal Badge:** Background: `#F0FDF4`, text: `#166534`, border: `1px solid #DCFCE7`.

### Lists & Data Grids
- **Header:** Uppercase `label-sm`, color `#5A6066`, background `#F8F9FF`, height 36px, border bottom `1px solid #E2E8F0`.
- **Rows:** Minimum height 48px, background `#FFFFFF`, bottom border `1px solid #F1F5F9`. Hover state shifts to `#F8FAFC`.
- **Data Cells:** Inter tabular body (`tabular-md`). Numerical telemetry and IDs use monospaced zero alignment.

### Inputs & Search Bars
- **Text & Triage Fields:** Base height 40px. Background `#FFFFFF`, border `1px solid #CBD5E1`, text `#001C33`. Internal padding `0 12px`.
- **Active / Focus:** Border changes to `1.5px solid #0159C5` with a `0 0 0 3px rgba(1, 89, 197, 0.15)` focus ring.
- **Error / SLA Breach:** Border `1.5px solid #BA1A1A` with matching red focus ring.

### Checkboxes & Radio Controls
- **Size:** 18x18px with 3px border radius for checkboxes; full circular for radios.
- **Border:** `1.5px solid #64748B`. Checked state filled with `#0159C5` with white checkmark glyph.

### Cards & Container Panels
- Surface `#FFFFFF`, outer border `1px solid #E2E8F0`, corner radius 8px, interior padding 16px or 24px.
- Incident cards feature a 4px left-hand border indicator colored according to priority tier (Green, Amber, Urgent Orange, Semantic Red).

### Domain-Specific Components
- **Telemetry Bar:** Top-level continuous ticker displaying real-time city service status, AI queue throughput, and active 311/911 bridge latency.
- **Dispatch Audit Trail Item:** Time-stamped vertical log entry featuring clear separation between human overrides and algorithmic routing decisions.