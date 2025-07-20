# Specification for Knowledge Capture

This document outlines the standard format for creating a "State Report" for any given feature or significant part of the application. The goal is to build a reliable knowledge base that allows any developer or AI agent to quickly understand how a feature is implemented, including its non-obvious details.

---

### **File Naming & Title**
-   **File location** .docs/knowledge
-   **Filename:** Should follow the pattern `[feature-name]-state-report.md`. Use kebab-case.
    -   *Example:* `auth-implementation-state-report.md`
-   **Title:** The H1 (`#`) inside the document should be `State Report: [Feature Name]`.
    -   *Example:* `# State Report: Authentication UI`
-   **Deprecation/Replacement:** If this doc replaces or supersedes previous docs, add a note at the top indicating which docs it replaces and why.

### **Last Updated**
-   **Guideline:** Add a "Last Updated" date at the top of the document, below the main title. Update this date whenever a significant change is made to the feature or its documentation.
-   **Format:** `**Last Updated:** YYYY-MM-DD`
-   **Goal:** To provide a clear indication of how current the information is.

### **1. Overview**
-   **Guideline:** A high-level, one-paragraph summary. What is this feature? What is its primary purpose in the application?
-   **Goal:** Provide immediate context without diving into technical details.
-   **Cross-Cutting Concerns:** If this feature interacts with other major systems (UI, API, DB, external services), briefly mention these relationships here and expand in later sections.

### **2. Key Components & File Paths**
-   **Guideline:** A bulleted list of the most critical files, directories, or components that make up the feature. For each item, provide a brief (one-sentence) description of its role.
-   **Goal:** Quickly guide a developer to the relevant parts of the codebase.

### **3. Implementation Details & Quirks**
-   **Guideline:** This is the most important section. Document any implementation detail that is not immediately obvious from reading the code. This includes:
    -   **Complex Logic:** Explain any particularly complex algorithms or business logic.
    -   **Workarounds:** Detail any workarounds for library bugs or framework limitations.
    -   **Styling Hacks:** Describe any complex CSS or styling tricks used to achieve a specific design. Explain *why* it was necessary.
    -   **"Gotchas":** Anything that might trip up a developer working on this feature in the future.
    -   **Type Safety & Middleware Patterns:** For TypeScript-heavy codebases, document any type assertion patterns, middleware guarantees, or common TS workarounds required for this feature.
    -   **Cross-System Integration:** If the feature affects multiple layers (UI, API, DB, etc.), include a section describing these interactions in detail.
-   **Goal:** Prevent future developers from having to re-debug the same problems. This section saves the most time and frustration.

### **4. Dependencies**
-   **Guideline:** List key external libraries, APIs, or services that the feature depends on. Include version numbers if they are critical. Provide a link to the official documentation.
-   **Goal:** Acknowledge external factors and provide resources for them.
-   **Internal Dependencies:** If the feature depends on other internal modules or services, list them here as well.

### **5. Configuration**
-   **Guideline:** List any environment variables or other configuration settings required for the feature to work correctly.
-   **Goal:** Make local setup and deployment easier.

### **6. Diagrams (Optional, but Encouraged for Complex Features)**
-   **Guideline:** If the feature involves a complex flow (e.g., data flow, state management, component hierarchy, or cross-system integration), provide a Mermaid diagram to visualize it.
-   **Goal:** Provide an easy-to-understand visual representation of the feature's architecture. 

### **7. Common Issues & Solutions (Mandatory for Tricky Features)**
-   **Guideline:** If this feature has a history of tricky bugs, non-obvious fixes, or common developer pitfalls, document them here. Include both the problem and the solution or workaround.
-   **Goal:** Save future developers from repeating the same mistakes. This section is required for foundational or historically problematic features. 

### **8. Design System & Styling**
-   **Guideline:** Document the design system implementation, including color usage, component variants, typography hierarchy, spacing rules, and animation patterns. Include rationale for design decisions and accessibility considerations.
-   **Goal:** Maintain visual consistency and understand styling decisions across the application.
-   **Design Tokens:** Document the centralized values for colors, spacing, typography, and other design elements.
-   **Component Variants:** Explain the different style variants available for each component and when to use each.
-   **Visual Hierarchy:** Describe how the design system creates visual hierarchy and guides user attention.
-   **Responsive Behavior:** Document how the design adapts to different screen sizes and devices.
-   **Accessibility:** Note any accessibility considerations in the design system, such as color contrast, focus states, and screen reader support.
-   **File Organization:** Document where design system files are located (`src/styles/`, `src/components/ui/`, etc.) and how they relate to each other.
-   **Integration with Libraries:** Explain how the design system integrates with Tailwind CSS, shadcn/ui, or other styling libraries used in the project.
-   **Custom Utilities:** Document any custom utility classes or CSS-in-JS patterns that extend the base design system. 