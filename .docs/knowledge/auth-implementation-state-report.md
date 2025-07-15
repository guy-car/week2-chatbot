
# State Report: Better Auth UI Implementation

**Last Updated:** 2024-07-15

## Overview
This document outlines the final implementation state of the new authentication UI, which uses the `@daveyplate/better-auth-ui` library. The system supports email/password, Google, and GitHub providers, replacing the previous simple GitHub-only login. The primary goal was to create a seamless sign-in/sign-up experience within a single, dynamic route and to resolve several complex styling challenges to align the new components with the project's existing design.

## Key Components & File Paths
-   **Auth Route:** `src/app/auth/[pathname]/page.tsx`
    -   Handles all authentication views (`sign-in`, `sign-up`, `forgot-password`, etc.) dynamically using the `<AuthCard>` component.
-   **Auth Configuration:** `src/lib/auth.ts`
    -   Configures the `next-auth` providers, including the new `Credentials` (email/password) and `Google` providers alongside the existing `GitHub` provider.
-   **Auth UI Provider:** `src/app/providers.tsx`
    -   Wraps the entire application with `<AuthUIProvider>` to provide context for the auth components. It is configured here to include social login buttons. This component is used in the root layout.
-   **Root Layout:** `src/app/layout.tsx`
    -   Integrates the `Providers` component to make the auth context available globally.
-   **Header Component:** `src/app/_components/client/HeaderClient.tsx`
    -   Conditionally renders the "Sign In" button, hiding it on all auth-related pages (`/auth/...`). The "Sign Up" button was removed in favor of a link within the sign-in form.

## Implementation Details & Quirks
This section highlights non-obvious solutions and workarounds discovered during implementation.

### 1. AuthCard Styling Overrides
The `<AuthCard>` component from the library required significant style overrides to match the application's design. These overrides are applied directly in `src/app/auth/[pathname]/page.tsx`.

-   **"Or continue with" Separator Alignment:**
    -   **Problem:** The separator text was misaligned, squeezed to the side of the container.
    -   **Solution:** The container `div` for the separator was targeted using the `classNames={{ separatorContainer: '...' }}` prop. Its style was changed to a 3-column CSS Grid (`grid grid-cols-[1fr_auto_1fr]`) to correctly center the text between the two full-width separator lines.

-   **Footer "Sign Up" Button Styling:**
    -   **Problem:** The default footer link needed to be styled as a full-width button, consistent with the social login buttons. The library renders a `<button>` inside an `<a>` tag, which created styling conflicts and a "double border" effect.
    -   **Solution:** A multi-part override was implemented via the `classNames={{ footer: '...', footerLink: '...' }}` prop:
        1.  The `footer` container was set to `flex flex-col` to stack the "Don't have an account?" text above the button.
        2.  The `footerLink` (`<a>` tag) was made into an unstyled container.
        3.  All visual button styles (background, border, padding, height, etc.) were applied directly to the inner `<button>` element using the advanced Tailwind selector `[&_button]:...`. The exact dimensions (`h-9 px-4 py-2`) from the social login buttons were used for consistency.

### 2. Dynamic Path Handling
-   The `[pathname]` from the URL is passed directly to the `pathname` prop of the `<AuthCard>` component. This is crucial for the component to know whether to render the sign-in, sign-up, or another auth-related form.

### 3. Social Logins
-   The social login buttons (Google, GitHub) are enabled via the `social` prop on the `<AuthUIProvider>` in `src/app/providers.tsx`. Without this, the buttons will not appear, even if the providers are configured in `src/lib/auth.ts`.

## Dependencies
-   **`@daveyplate/better-auth-ui`**: The core library for the authentication UI components.
-   **`next-auth`**: Handles the underlying authentication logic and provider integrations.
-   **`bcrypt`**: Used for hashing passwords for the `Credentials` provider.

## Configuration
-   Ensure all required environment variables for Google and GitHub OAuth providers (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`) are present in the `.env` file. 