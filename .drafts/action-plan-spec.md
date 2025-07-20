# Action Plan: [Descriptive Title]

## 0. Guiding Principles & Execution Protocol (NEW)
> **This preamble is the most critical part of the plan and must be followed strictly.**

1.  **Immutable Plan**: The agent must follow this plan exactly as written and MUST NOT edit it. If a step is impossible, it must stop and report the issue.
2.  **Documentation is Law**: If the plan involves a library, the primary resource MUST be its official documentation. The agent must use the exact component names and props from the documentation.
3.  **One Step at a Time**: The agent will perform only one "Action" at a time and will only proceed after successfully completing the "Verification" step for that action.
4.  **Design System First**: When implementing UI changes, always establish design tokens and component styles before modifying existing components.
5.  **Visual Verification**: For UI implementations, include visual verification steps (screenshots, design comparison) alongside functional verification.
6.  **Frontend-Specific Steps**: Design system implementation steps (Parts 2-3) only apply to frontend/UI features. Backend features should skip these sections.
7.  **Reference Existing Styles**: Before implementing new UI changes, always check existing style documentation in `.docs/knowledge/` and current component styles in `src/components/ui/` and `src/styles/` to avoid duplicating work and maintain consistency.

---

## 1. Overall Goal
-   A concise summary of the final, desired state.
-   **Explicitly state what is NOT in scope** to prevent feature creep. (e.g., "This plan does not include implementing email-sending for password resets.")

## 2. Regression Risks & Mitigation
-   A list of potential issues and how the plan will prevent or test for them.

## 3. Structured Action & Verification Plan (IMPROVED STRUCTURE)
> **This section must be a list of paired "Action" and "Verification" steps.**

### Part 1: [Logical Group of Tasks]

-   **Action 1.1:** A single, small, concrete task. (e.g., "Run `bun add <package>`" or "Modify the existing file `src/lib/auth.ts` to add the Google provider.")
-   **Verification 1.1:** A simple, objective check to prove the action was successful. (e.g., "Check that the package appears in `package.json`" or "Run `bun build` and confirm the application compiles without errors.")

-   **Action 1.2:** ...
-   **Verification 1.2:** ...

### Part 2: Design System Implementation

-   **Action 2.1:** Create design tokens file with color palette, spacing, and typography values
-   **Verification 2.1:** Design tokens are exported and can be imported in other files

-   **Action 2.2:** Update component styles to use design tokens
-   **Verification 2.2:** All existing components compile without errors and use centralized tokens

-   **Action 2.3:** Create custom utility classes for common patterns
-   **Verification 2.3:** Utility classes are available and can be applied to components

### Part 3: UI Component Updates

-   **Action 3.1:** Update shadcn components to use new design system
-   **Verification 3.1:** Components render with new styling and maintain functionality

-   **Action 3.2:** Implement new layout structure (header, sidebar, main content)
-   **Verification 3.2:** Layout renders correctly and is responsive

-   **Action 3.3:** Add visual effects (glows, shadows, animations)
-   **Verification 3.3:** Effects are applied consistently and perform well

---
FILE FORMAT GUIDELINES:

File type should be markdown
File naming convention:
- Start with date and time in EST (New York City) using the format: MM.DD.YY-HHMM
- Followed by a relevant short title in lower case separated by dashes
- Get the current date/time in EST using the terminal command: `date`
  The command will output something like: "Mon Jul 14 13:56:40 EDT 2025"
  Use this to format your filename accordingly.

Example filename: 01.15.25-1430-user-authentication-implementation.md

Place the file in .notes/action-plans 