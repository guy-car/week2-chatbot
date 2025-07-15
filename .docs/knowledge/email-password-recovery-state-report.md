# State Report: Email & Password Recovery

**Last Updated:** 2025-07-15

## 1. Overview
This document outlines the implementation of the email verification and password recovery feature. The system uses the `better-auth` library to handle the authentication logic and token generation, and the `resend` service to send transactional emails to users.

## 2. Key Components & File Paths
-   **`src/lib/auth.ts`**: This is the core configuration file for `better-auth`. It now includes implementations for `sendEmailVerification` and `sendResetPassword` that connect the auth events to the email sending service.
-   **`src/lib/email.ts`**: Initializes the `resend` client using the API key from environment variables and exports a reusable `sendEmail` helper function.
-   **`src/emails/`**: This directory contains the React Email templates used for the emails.
    -   `VerificationEmail.tsx`: Template for new user email verification.
    -   `PasswordResetEmail.tsx`: Template for password reset requests.
-   **`src/env.js`**: Defines the validation schema for all environment variables, including the `RESEND_API_KEY` required by the email service.

## 3. Implementation Details & Quirks
-   **`better-auth` Specifics:** The `better-auth` library has specific property names for its email handlers. The correct property for sending a verification email is `sendEmailVerification`, not `sendVerificationEmail` as a placeholder might suggest.
-   **Argument Typing:** The email handler functions in `better-auth` pass a single `data` object as an argument. This object, which contains `user`, `url`, and `token`, must be correctly typed to satisfy TypeScript.
-   **Environment Validation:** The application uses `@t3-oss/env-nextjs` for strict environment variable validation. Any new server-side variables (like `RESEND_API_KEY`) must be added to both the `server` and `runtimeEnv` sections of the configuration object in `src/env.js` for the application to build successfully.

## 4. Dependencies
-   **`better-auth`**: The core authentication library.
-   **`resend`**: The email sending service. [Official Documentation](https://resend.com/docs/api-reference/introduction)
-   **`@react-email/components`**: Used to build the email templates with React.

## 5. Configuration
-   **`RESEND_API_KEY`**: This environment variable is required for the email service to function. It should be added to the `.env` file.
-   **Email `from` address**: The `from` address in `src/lib/email.ts` is currently set to `onboarding@resend.dev` for development. This should be updated to a custom domain for production use. 