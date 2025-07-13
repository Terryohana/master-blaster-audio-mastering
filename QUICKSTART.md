# Master Blaster Authentication Quick Start

Follow these steps to get the authentication system up and running:

## 1. Deploy Schema Changes

First, deploy your schema changes to Convex:

```bash
npx convex login
npx convex deploy
```

## 2. Start the Development Server

Start your development server:

```bash
npm run dev
```

## 3. Test Authentication

1. Open your browser and navigate to `http://localhost:5173`
2. You should be redirected to the sign-in page
3. Create a new account or sign in with an existing one
4. After signing in, you'll be redirected to the main application

## 4. Set Up Admin User

To set up an admin user:

1. Sign in with the user you want to make an admin
2. Use the Convex dashboard to update the user's role:
   ```bash
   npx convex dash
   ```
3. In the dashboard, navigate to the `userProfiles` table
4. Find your user's profile and update the `role` field to `"admin"`

## 5. Test Role-Based Access

1. Sign in with a regular user account
   - You should only see your own projects
   - The Admin page should not be visible

2. Sign in with an admin account
   - You should see the Admin page in the navigation
   - You should have access to all projects

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Verify that your Clerk API keys are correctly set in `.env.local`
3. Make sure your Convex schema has been deployed successfully
4. Clear your browser cache and cookies if needed