# Figma MCP Workflow - Living Document

**Last Updated:** 2025-07-20

## Overview
This document tracks our workflow for using Figma MCP tools to implement designs in code. It captures lessons learned, best practices, and common pitfalls.

## Figma MCP Tools Available

### 1. `get_code`
- **What it does**: Generates React/JSX code from Figma design
- **What you get**: Technical properties (colors, dimensions, positioning, styling)
- **Limitation**: Cannot see actual visual design, only code properties

### 2. `get_image` 
- **What it does**: Gets screenshot/image of selected node
- **What you get**: Actual visual representation of the design
- **Use case**: Understanding visual hierarchy and relationships

### 3. `get_variable_defs`
- **What it does**: Gets Figma design tokens/variables
- **What you get**: Centralized design values (colors, spacing, etc.)
- **Use case**: Extracting design system tokens

### 4. `get_code_connect_map`
- **What it does**: Maps Figma components to existing code components
- **What you get**: Links between design and implementation
- **Use case**: Understanding component relationships

## Best Practices

### For You (Figma Designer)

#### 1. **Component Naming**
- ✅ **Good**: "Send Button", "Chip Button", "Sidebar Button"
- ❌ **Bad**: "Button", "Secondary Button", "Primary Button"
- **Why**: Clear names prevent assumptions about standard patterns

#### 2. **Layer Organization**
- ✅ **Good**: Group related elements logically
- ✅ **Good**: Use descriptive layer names
- ❌ **Bad**: Generic names like "Rectangle", "Text"

#### 3. **Design Tokens**
- ✅ **Good**: Use Figma variables for colors, spacing, typography
- ✅ **Good**: Name variables descriptively (e.g., "primary-cyan", "sidebar-bg")
- ❌ **Bad**: Hardcoded values scattered throughout

#### 4. **Comments & Documentation**
- ✅ **Good**: Add notes to explain component purposes
- ✅ **Good**: Document interaction states and behaviors
- ❌ **Bad**: Relying on visual context alone

### For Me (AI Agent)

#### 1. **Component Inventory First**
```
"Let me identify all interactive elements in your design:
1. Send button (bottom right) - orange outline, dark background
2. Conversation chips (middle) - orange glow effect  
3. Sidebar buttons (left) - cyan outline, transparent background
Is this correct?"
```

#### 2. **Ask for Confirmation**
- ✅ **Good**: "I see X, Y, Z - is this correct?"
- ✅ **Good**: "This button here has this style - right?"
- ❌ **Bad**: Making assumptions about standard patterns

#### 3. **Visual + Code Analysis**
- ✅ **Good**: Use both `get_code` AND `get_image`
- ✅ **Good**: Compare visual design with code properties
- ❌ **Bad**: Relying only on code properties

#### 4. **Start Small**
- ✅ **Good**: Extract one component type at a time
- ✅ **Good**: Verify each component before moving to next
- ❌ **Bad**: Trying to extract everything at once

## Common Pitfalls & Gotchas

### For You (Designer)

#### 1. **Generic Component Names**
- **Problem**: "Button" vs "Send Button" leads to assumptions
- **Solution**: Use descriptive, specific names

#### 2. **Inconsistent Naming**
- **Problem**: "Primary", "Secondary" don't match actual design
- **Solution**: Name based on function/location, not generic patterns

#### 3. **Missing Context**
- **Problem**: Agent can't see visual relationships
- **Solution**: Add comments explaining component purposes

### For Me (Agent)

#### 1. **Assumption Trap**
- **Problem**: Assuming "primary" = standard button pattern
- **Solution**: Always ask for confirmation of component types

#### 2. **Code vs Visual Mismatch**
- **Problem**: Figma code structure doesn't match visual design
- **Solution**: Use both `get_code` and `get_image` together

#### 3. **Over-Engineering**
- **Problem**: Creating generic patterns instead of specific implementations
- **Solution**: Start with exact design, then generalize if needed

## Workflow Checklist

### Before Starting Implementation
- [ ] Extract design tokens from Figma
- [ ] Create component inventory
- [ ] Confirm component types with designer
- [ ] Verify visual design matches code properties
- [ ] Plan implementation phases

### During Implementation
- [ ] Implement one component type at a time
- [ ] Test each component before moving to next
- [ ] Verify against original design
- [ ] Document any deviations or decisions

### After Implementation
- [ ] Visual verification against Figma
- [ ] Test on different screen sizes
- [ ] Update documentation
- [ ] Note any workflow improvements

## Recent Lessons Learned

### 2025-07-20: Button Variants Issue
- **Problem**: Created generic "primary", "secondary", "success" buttons
- **Reality**: Design had "send button", "chip button", "sidebar button"
- **Lesson**: Always confirm component types before creating variants
- **Improvement**: Start with component inventory approach

### 2025-07-20: Custom Sidebar Implementation Success
- **Problem**: Complex sidebar implementation with multiple technical challenges
- **Solution**: Parallel development approach with gradual migration
- **Key Learnings**:
  - **React Context Best Practices**: Context providers should wrap entire app when used globally
  - **Next.js App Router Patterns**: Clear separation between server/client components required
  - **Design System Integration**: Use established design tokens as source of truth
  - **Animation Performance**: CSS transforms outperform layout-based animations
- **Improvements**: 
  - Document component hierarchy before implementation
  - Test context providers at app level early
  - Use fixed positioning with dynamic calculations for responsive design
- **Related Documentation**: See **[UI Architecture State Report](../.docs/knowledge/ui-architecture-state-report.md)** for complete technical details

## Future Improvements

### For Figma
- Consider using Figma variables more extensively
- Add component descriptions in Figma
- Use consistent naming conventions

### For Workflow
- Create standard component inventory template
- Develop visual verification checklist
- Establish confirmation protocols

---

**Note**: This is a living document. Update with new lessons learned and workflow improvements. 