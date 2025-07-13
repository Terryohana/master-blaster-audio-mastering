# Troubleshooting Guide

This guide helps you resolve common issues with the Master Blaster authentication system.

## Missing Function Errors

If you see errors like:

```
Could not find public function for 'auth:isAdmin'. Did you forget to run `npx convex dev` or `npx convex deploy`?
```

### Solution:

1. Start the Convex development server:
   ```bash
   npx convex dev
   ```

2. Or deploy your changes:
   ```bash
   npx convex login
   npx convex deploy
   ```

## Blank Screen After Login

If you see a blank screen after logging in:

### Solution:

1. Check the browser console for errors
2. Try clearing your browser cache and cookies
3. Make sure your Convex schema matches the code expectations
4. Try using the simplified components:
   - SimpleDashboard is available as a fallback

## Development Keys Warning

If you see:

```
Clerk has been loaded with development keys
```

### Solution:

This is normal during development. When you're ready to deploy to production:

1. Create a production instance in the Clerk dashboard
2. Update your environment variables with production keys

## Database Schema Issues

If you're having issues with the database schema:

### Solution:

1. Check that your schema matches the expected structure
2. Run the Convex development server to apply schema changes:
   ```bash
   npx convex dev
   ```

3. Or manually update the schema through the Convex dashboard:
   ```bash
   npx convex dash
   ```

## Authentication Flow Issues

If users can't sign in or sign up:

### Solution:

1. Verify your Clerk API keys in `.env.local`
2. Check that your Clerk application is properly configured
3. Make sure you've enabled the authentication methods you want to use
4. Check the browser console for specific errors

## Role-Based Access Issues

If role-based access isn't working correctly:

### Solution:

1. Check that user profiles have the correct role field
2. Verify that the isAdmin function is properly deployed
3. Make sure the role check is working in the UI components