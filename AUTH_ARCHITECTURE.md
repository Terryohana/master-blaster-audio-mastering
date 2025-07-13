# Master Blaster Authentication Architecture

This document outlines the authentication architecture for the Master Blaster Audio Mastering App, which uses Clerk for authentication and Convex for backend services.

## Overview

The authentication system provides:

1. User registration and login with multiple options (email/password, social logins)
2. Role-based access control (free users, premium users, admins)
3. Secure project access (users only see their own projects)
4. Session management with proper token handling
5. Low-friction user experience with minimal login steps

## Architecture Components

### 1. Authentication Provider: Clerk

Clerk handles:
- User registration and login
- Social login providers (Google, GitHub, etc.)
- Session management
- User profile data
- Token generation and validation

### 2. Backend: Convex

Convex handles:
- User data storage
- Role-based access control
- Project access permissions
- Subscription management
- Admin functionality

### 3. Integration Layer

The integration between Clerk and Convex is handled by:
- `ClerkProviderWithConvex.tsx`: Provides Clerk context to the app and syncs user data with Convex
- `auth.ts`: Contains functions for user authentication and verification
- `access.ts`: Implements access control for projects and resources

## Data Flow

1. User signs in through Clerk UI
2. Clerk generates authentication token
3. Token is passed to Convex through `ConvexProviderWithClerk`
4. User data is synced between Clerk and Convex via `syncUser` action
5. Application checks user roles and permissions for access control

## User Roles

The system supports the following roles:

1. **User**: Regular user with access to their own projects
2. **Admin**: Administrative user with access to all projects and admin functions

## Subscription Tiers

Users can have the following subscription tiers:

1. **Free**: Limited to 10 tracks
2. **Starter**: Up to 25 tracks
3. **Pro**: Up to 50 tracks
4. **Unlimited**: Up to 100 tracks

## Security Considerations

1. **Token-based Authentication**: All requests are authenticated using secure tokens
2. **Role-based Access Control**: Resources are protected based on user roles
3. **Resource Isolation**: Users can only access their own projects
4. **Admin Verification**: Admin functions require explicit role verification

## Implementation Details

### Frontend Components

- `AuthComponents.tsx`: Contains Clerk UI components for sign-in, sign-up, and user profile
- `AuthGuard.tsx`: Protects routes that require authentication

### Backend Functions

- `auth.ts`: Authentication-related functions
- `users.ts`: User management functions
- `access.ts`: Access control functions
- `admin.ts`: Admin-only functions

## Environment Configuration

Required environment variables:

```
# Convex
CONVEX_DEPLOYMENT=your-deployment-id
CONVEX_SITE_URL=http://localhost:5173

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
CLERK_SECRET_KEY=sk_test_your-secret-key
```