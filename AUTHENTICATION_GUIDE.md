# Master Blaster Authentication Implementation Guide

This guide provides instructions for implementing the Clerk authentication system in the Master Blaster Audio Mastering App.

## Setup Steps

### 1. Install Required Dependencies

```bash
npm install @clerk/clerk-react @clerk/themes
```

### 2. Configure Environment Variables

Create or update your `.env.local` file with the following variables:

```
# Convex
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

### 3. Set Up Clerk Account

1. Sign up at [clerk.dev](https://clerk.dev)
2. Create a new application
3. Configure authentication methods (email/password, social logins)
4. Get your API keys from the Clerk dashboard
5. Update your environment variables with the actual keys

### 4. Update Convex Schema

Run the following command to push schema changes to your Convex deployment:

```bash
npx convex push
```

## Authentication Flow

1. User visits the application
2. If not authenticated, they are presented with sign-in/sign-up options
3. After authentication, Clerk provides a token
4. The token is used to authenticate with Convex
5. User data is synced between Clerk and Convex
6. Role-based access control is applied based on user profile

## Role-Based Access Control

The system supports two roles:

1. **User**: Regular user with access to their own projects
2. **Admin**: Administrative user with access to all projects and admin functions

To set a user as admin, use the Convex dashboard or create an admin function to update user roles.

## Subscription Tiers

Users can have the following subscription tiers:

1. **Free**: Limited to 10 tracks
2. **Starter**: Up to 25 tracks
3. **Pro**: Up to 50 tracks
4. **Unlimited**: Up to 100 tracks

## Security Best Practices

1. Always verify user authentication before accessing protected resources
2. Use role-based checks for admin functions
3. Validate project ownership before allowing access
4. Keep Clerk API keys secure and never expose them in client-side code
5. Regularly rotate API keys and secrets

## Troubleshooting

If you encounter authentication issues:

1. Check that environment variables are correctly set
2. Verify that Clerk is properly configured
3. Check Convex logs for authentication errors
4. Ensure the schema has been properly updated
5. Clear browser cache and cookies if needed