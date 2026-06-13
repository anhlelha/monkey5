---
name: ai4all-ui
description: Enforces the AI4ALL project design system. Use this for all UI/UX tasks in this project to ensure consistency with existing color tokens, typography, and layout rules.
skills: ["frontend-design"]
---

# AI4ALL Design System Skill

This skill ensures that all new interface components, pages, and layout modifications strictly follow the established **AI4ALL Design System** located in the project root.

## 🗺️ RESOURCE MAP (GPS)
To ensure correct paths and asset usage, always refer to these root locations:
- **Core Strategy**: `design_system/docs/design-system.md`
- **Implementation patterns**: `design_system/docs/implementation-guide.md`
- **HTML Boilerplate**: `design_system/template.html`
- **CSS Tokens**: `design_system/assets/css/tokens.css`
- **CSS Components**: `design_system/assets/css/components.css`
- **JS Features**: `design_system/assets/js/theme.js`, `design_system/assets/js/nav.js`

## 🔴 MANDATORY PRE-REQUISITES
Before implementing any UI change, you **MUST** read the docs listed in the Resource Map above.

## 📐 CORE LAYOUT RULES (AI4ALL SPECIFIC)

### 1. Full-Width Strategy
- **NO Restrictive Widths**: Dashboard main content sections must **never** use `max-w-*` constraints. They must span the **full available width**.
- **Content Wrapper**: Always use `.content-inner` with `w-full`.

### 2. Stats & Metrics (Metrics Strip)
- **Single-Row Layout**: Overview metrics must always be arranged in a **single horizontal row**.
- **Flexible Grid**: The grid column count must match the number of metrics (e.g., Use `grid-cols-5` if there are 5 cards).

### 3. Sidebar Branding
- **Integrated Look**: The sidebar's brand/logo section must be **borderless** (no `border-bottom`).

### 4. Side-by-Side Forms (Complex Config)
- **Constraint-Free**: Never use `max-w-2xl` or similar for complex settings.
- **Duo Layout**: Use a 12-column grid.
  - **Column A (Identity - 4cols)**: Brief info, name, type, active status.
  - **Column B (Logic - 8cols)**: Prompts, LLM settings, routing, and main actions.

## 🎨 ADVANCED DESIGN PRINCIPLES

### 4. The "No-Line" Rule (Tonal Layering)
- **Concept**: Separate major sections using background color shifts (Ambient Layers) instead of borders.
- **Application**: Used primarily on Landing Pages and high-level Dashboard containers.
- **Tokens**: Use `var(--color-bg-alt)` for the background of a section to distinguish it from a white/dark card.

### 5. Interactive Polish
- **Card Hover**: Cards should have a visible but subtle hover state.
- **Rules**: Use `transition: all 0.2s ease`, `transform: translateY(-2px)`, and `box-shadow: var(--shadow-warm)`.
- **CSS Class**: apply `.card-hover` or `.provider-card:hover`.

### 6. Glassmorphism Standard
- **Usage**: Only for top-level overlays (Header, Sidebar, Modals).
- **Rule**: Background must be `rgba(..., 0.8)` with `backdrop-filter: blur(12px)`.
- **Constraint**: Do NOT use glassmorphism for main content cards as it affects readability.

### 7. Hub Navigation (State-driven UI)
- **Pattern**: When switching sub-sections (e.g., Whitelist -> Billing), swap the component in a fixed container.
- **Transition**: Every section swap must trigger a `fade-in-up` animation to smooth the transition.

## 🚀 HOW TO USE
When given a task to "create a new page" or "modify layout":
1.  Invoke the `/ai4all-ui` workflow.
2.  Use `template.html` for root-level pages, `template-sub.html` for detail pages.
3.  For React components, use `var(--color-...)` tokens directly in `style` or via Tailwind config mapping.

---
*Reference Project DNA: AI4ALL Editorial Design.*
