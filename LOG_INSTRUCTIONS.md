# How to Check Logs in Master Blaster

## Browser Console Logs

1. Open your application in the browser
2. Right-click anywhere on the page and select "Inspect" or press F12
3. Go to the "Console" tab
4. Look for any red error messages

## Convex Logs

To check Convex logs, you need to be logged in and have a deployment set up:

```bash
# Login to Convex
npx convex login

# Set your deployment
npx convex deploy

# Then check logs
npx convex logs
```

## Local Development Logs

When running the development server:

```bash
# Start the development server with verbose logging
npm run dev -- --debug
```

## Admin Login

To log in as the admin user:

1. Start the application: `npm run dev`
2. Open the application in your browser
3. Sign in with:
   - Email: methodman@mail.com
   - Password: 12345678

4. After signing in, you should have admin privileges
5. Navigate to the Admin page from the dashboard

## Creating Admin User

If the admin user doesn't exist yet, you can create it using the Convex dashboard:

1. Run `npx convex dash` to open the dashboard
2. Go to the "Data" tab
3. Find the "users" table and create a new user with:
   - email: methodman@mail.com
   - tokenIdentifier: password:methodman@mail.com
   - name: Admin User
   - lastSignIn: (current timestamp)

4. Then create a profile in the "userProfiles" table with:
   - userId: (the ID of the user you just created)
   - role: "admin"
   - subscriptionTier: "unlimited"
   - tracksUsed: 0