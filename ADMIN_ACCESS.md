# Admin Access Instructions

## How to Access the Admin Panel

1. Navigate to the admin login page:
   ```
   http://localhost:5173/admin-login
   ```

2. Use the following credentials:
   - Email: methodman@mail.com
   - Password: 12345678

3. After successful login, you'll be redirected to the admin panel.

## Admin Panel Features

The admin panel includes:

1. **User Management**
   - View all users
   - See subscription details
   - Track storage usage

2. **Subscription Statistics**
   - View subscription counts by tier
   - Track monthly and annual revenue
   - Monitor total storage usage

3. **Danger Zone**
   - Delete all user data (use with caution)

## Troubleshooting

If you encounter authentication issues:

1. Make sure the Convex backend is running:
   ```bash
   npx convex dev
   ```

2. Check that the admin user exists in the database:
   ```bash
   npx convex dash
   ```

3. If needed, manually create the admin user:
   - Go to the "users" table and create a user with email "methodman@mail.com"
   - Go to the "userProfiles" table and create a profile with role "admin"

4. Clear browser cache and cookies if needed