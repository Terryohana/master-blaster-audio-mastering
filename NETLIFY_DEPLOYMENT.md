# Deploying Master Blaster to Netlify

This guide will walk you through deploying the Master Blaster application to Netlify using GitHub.

## Prerequisites

1. A GitHub account
2. A Netlify account
3. A Convex account
4. A Clerk account

## Step 1: Push your repository to GitHub

1. Create a new repository on GitHub
2. Push your local repository to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/master-blaster.git
   git push -u origin main
   ```

## Step 2: Connect to Netlify

1. Log in to your Netlify account
2. Click "New site from Git"
3. Select GitHub as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your Master Blaster repository
6. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click "Deploy site"

## Step 3: Configure Environment Variables

1. In your Netlify site dashboard, go to "Site settings" > "Environment variables"
2. Add the following environment variables:
   - `VITE_CONVEX_URL`: Your Convex deployment URL
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key

## Step 4: Configure Convex

1. Log in to your Convex dashboard
2. Go to your deployment settings
3. Add your Netlify site URL to the allowed origins

## Step 5: Configure Clerk

1. Log in to your Clerk dashboard
2. Go to your application settings
3. Add your Netlify site URL to the allowed redirect URLs and origins

## Step 6: Deploy Updates

Any future changes pushed to your GitHub repository will automatically trigger a new deployment on Netlify.

## Troubleshooting

- If your site fails to build, check the build logs in Netlify
- Ensure all environment variables are correctly set
- Verify that your Convex and Clerk configurations are correct