# Workflow: /ai4all-ui (UI Execution)

Apply the AI4ALL project design system to a feature or page.

## Phase 1: Context & Audit 🔍
1.  Read the **AI4ALL Design System** documentation:
    - [design-system.md](../../design_system/docs/design-system.md)
    - [implementation-guide.md](../../design_system/docs/implementation-guide.md)
2.  Inspect the **existing implementation** (e.g., `src/app/admin/page.tsx`) to check for alignment.
3.  Identify any layout violations (e.g., `max-w-*` limits, sidebar borders).

## Phase 2: Design Plan 🏗️
1.  Create or update a **Plan file** (e.g., `plans/ui-update.md`).
2.  Define the **UI component structure** based on `template.html`.
3.  Specify the **Metrics Grid** column count (ensure single-row behavior).
4.  Get user approval on the visual approach.

## Phase 3: Implementation 🛠️
1.  Apply changes to the React components or HTML templates.
2.  Use **custom CSS variables** for all colors and spacing.
3.  Ensure **full-width** layouts for all main sections.
4.  Verify the **Dark Mode** compatibility.

## Phase 4: Verification ✅
1.  Run a visual review (or use `ux_audit.py` if applicable).
2.  Check for responsive behavior (single-row on desktop, wrap on mobile).
3.  Final walkthrough with the user.
