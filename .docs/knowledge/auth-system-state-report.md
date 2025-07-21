# State Report: Authentication System

**Last Updated:** 2024-07-17

## 1. Overview

This document outlines the complete authentication system implementation, which uses the `better-auth` library (not `next-auth` as might be assumed) to provide email/password authentication, social login providers (Google, GitHub), email verification, password recovery, and secure API integration via tRPC. The system includes a custom UI built with `@daveyplate/better-auth-ui` that required significant styling overrides to match the application's design. The authentication system is deeply integrated with the database through Row Level Security (RLS) and affects all protected API endpoints.

## 2. Key Components & File Paths

- **Core Auth Library:** `src/lib/auth.ts` - Configures `better-auth` with email/password, Google, and GitHub providers, plus email verification and password reset handlers
- **Email Service:** `src/lib/email.ts` - Initializes the `resend` client and provides email sending functionality
- **Email Templates:** `src/emails/` - Contains React Email templates for verification and password reset
- **Auth UI:** `src/app/auth/[pathname]/page.tsx` - Dynamic route handling all auth views using the `<AuthCard>` component
- **Auth Provider:** `src/app/providers.tsx` - Wraps the app with `<AuthUIProvider>` to provide auth context
- **tRPC Integration:** `src/server/api/trpc.ts` - Defines protected procedures with authentication middleware and RLS integration
- **Protected Routers:** `src/server/api/routers/` - All API endpoints that require authentication (chats, movies, preferences)
- **Environment Validation:** `src/env.js` - Strict validation schema for all auth-related environment variables

## 3. Implementation Details & Quirks

### 3.1 Better-Auth Library Integration

**Critical Detail:** The application uses `better-auth`, not `next-auth`. This is a fundamental architectural difference that affects all authentication flows.

- **Email Handlers:** The library uses specific property names like `sendEmailVerification` (not `sendVerificationEmail`)
- **Type Safety:** All email handler functions receive a `data` object with `user`, `url`, and `token` properties that must be properly typed
- **Session Management:** Sessions are handled through `auth.api.getSession()` in the tRPC context

### 3.2 tRPC Authentication Integration

**Type Safety Challenge:** The tRPC protected procedures require explicit type assertions for `ctx.user` because TypeScript doesn't recognize that the middleware guarantees user authentication.

- **Middleware Pattern:** Uses `enforceUserIsAuthed` middleware that throws `UNAUTHORIZED` errors for unauthenticated requests
- **Type Assertions:** All protected procedures must use `ctx.user!.id` instead of `ctx.user.id` to satisfy TypeScript
- **RLS Integration:** The `rlsMiddleware` sets the user ID in database transactions for Row Level Security
- **Context Spreading:** The middleware spreads the entire context (`...ctx`) to maintain all properties

### 3.3 Database Integration & RLS

- **Row Level Security:** All database queries are automatically scoped to the authenticated user
- **Transaction Handling:** The `rlsMiddleware` wraps procedures in database transactions and sets the user ID
- **User Context:** The user ID is automatically available in all protected procedures for database operations

### 3.4 Email System Implementation

- **Resend Integration:** Uses the `resend` service for transactional emails
- **React Email Templates:** Custom templates for verification and password reset emails
- **Environment Variables:** Requires `RESEND_API_KEY` in the environment configuration
- **Type Safety:** Email handlers must be properly typed with the `EmailData` interface

### 3.5 UI Component Styling Challenges

**Complex DOM Structure:** The `@daveyplate/better-auth-ui` library required significant styling overrides due to unexpected DOM structures.

- **Separator Alignment:** The "Or continue with" separator required CSS Grid (`grid-cols-[1fr_auto_1fr]`) instead of flexbox for proper centering
- **Footer Button Styling:** The footer link contains a nested `<button>` inside an `<a>` tag, requiring advanced Tailwind selectors (`[&_button]:...`) to style the inner button
- **Social Login Configuration:** The `social` prop must be passed to `<AuthUIProvider>` for social login buttons to appear
- **Dynamic Routing:** The `pathname` prop is essential for the component to know which auth form to render

**AuthCard Class Names:** The component accepts specific class names for different sections:

- **`form.primaryButton`**: Targets the main Login button
- **`form.providerButton`**: Targets social login buttons (GitHub/Google)
- **`form.secondaryButton`**: Targets secondary form buttons
- **`footer`**: Targets footer section with `[&_button]:...` selectors
- **`base`**: Targets the entire card container
- **`continueWith`**: Targets the "Or continue with" separator

**Styling Patterns:**
- Use direct hex values with opacity: `bg-[#00E5FF]/60`
- Target nested elements: `[&_button]:bg-[#00E5FF]/20`
- Avoid invalid CSS selectors that cause build errors
- Localization for button text doesn't work (component limitation)

**Example Implementation:**
```tsx
classNames={{
  form: {
    primaryButton: "bg-[#00E5FF]/60 text-white border border-white/60 hover:bg-[#00E5FF]/40",
    providerButton: "bg-transparent border border-[#FD8E2C] text-white hover:bg-[#FD8E2C]/10"
  },
  footer: "[&_button]:w-full [&_button]:bg-[#00E5FF]/20 [&_button]:border [&_button]:border-input",
  base: "border border-[#00E5FF] rounded-md p-6"
}}
```

### 3.6 Environment Validation Requirements

**Strict Schema:** The application uses `@t3-oss/env-nextjs` for strict environment variable validation.

- **Exact Mapping:** The `env.js` schema must perfectly mirror the actual `.env` file variables
- **Server Variables:** All server-side variables (like `RESEND_API_KEY`) must be added to both `server` and `runtimeEnv` sections
- **Build Failures:** Environment mismatches cause build failures, making this a critical deployment requirement

### 3.7 Development Standards & Error Handling

- **Type Precision:** The codebase requires exact property names and proper TypeScript types for library integrations
- **Build Failures:** TypeScript errors are treated as blocking issues that prevent deployment
- **Error Handling:** Failed updates should have fallbacks to original content
- **Logging:** Comprehensive error logging is required for debugging authentication issues

## 4. Dependencies

- **`better-auth`**: Core authentication library (not next-auth)
- **`@daveyplate/better-auth-ui`**: UI components for authentication forms
- **`resend`**: Email sending service for verification and password reset
- **`@react-email/components`**: React Email templates
- **`bcrypt`**: Password hashing for the Credentials provider
- **`drizzle-orm`**: Database adapter for better-auth
- **`@trpc/server`**: API layer with authentication middleware

## 5. Configuration

### Required Environment Variables:
- `AUTH_BASE_URL`: Base URL for authentication (defaults to localhost:3000)
- `RESEND_API_KEY`: Email service API key
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: GitHub OAuth provider
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth provider
- `VERCEL_URL`: For trusted origins in production

### Database Configuration:
- Uses PostgreSQL with Drizzle adapter
- Row Level Security (RLS) enabled for all user-scoped data
- User sessions stored in database

## 6. Common Issues & Solutions

### 6.1 TypeScript Integration Challenges
- **Problem:** tRPC protected procedures show "ctx.user is possibly undefined" errors
- **Solution:** Use type assertions (`ctx.user!.id`) in all protected procedures
- **Root Cause:** TypeScript doesn't recognize middleware guarantees

### 6.2 Environment Validation Failures
- **Problem:** Build fails with environment variable errors
- **Solution:** Ensure `env.js` schema exactly matches `.env` file variables
- **Prevention:** Always confirm exact environment schema before modifying validation

### 6.3 Email Handler Type Errors
- **Problem:** TypeScript errors with email handler function signatures
- **Solution:** Use correct property names (`sendEmailVerification`) and proper `EmailData` typing
- **Prevention:** Always use official library type definitions

### 6.4 UI Styling Conflicts
- **Problem:** AuthCard components don't match application design
- **Solution:** Use advanced CSS selectors and inspect rendered HTML for DOM structure
- **Prevention:** Never assume third-party component internal structure

### 6.5 Social Login Missing
- **Problem:** Social login buttons don't appear
- **Solution:** Pass `social` prop to `<AuthUIProvider>` and ensure providers are configured
- **Prevention:** Separate UI configuration from backend provider setup

## 7. Architecture Flow

```
User Request → Auth Middleware → tRPC Context → Protected Procedure → Database (RLS)
     ↓              ↓                ↓                ↓                    ↓
  Session Check → User Validation → Type Assertion → Business Logic → User-Scoped Data
```

The authentication system is deeply integrated across all layers, requiring coordination between the UI components, API middleware, database security, and email services. Any changes to the auth system must consider the impact on all these layers. 