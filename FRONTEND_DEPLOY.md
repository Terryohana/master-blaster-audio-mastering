# Deploying the Frontend to Netlify

This guide will walk you through deploying only the frontend of the Master Blaster application to Netlify.

## Prerequisites

1. A GitHub account
2. A Netlify account

## Step 1: Push your repository to GitHub

Your repository is already connected to GitHub at:
https://github.com/Terryohana/master-blaster-audio-mastering.git

Make sure to push your latest changes:
```bash
git add .
git commit -m "Prepare frontend for deployment"
git push origin main
```

## Step 2: Deploy to Netlify

### Option 1: Deploy via Netlify UI

1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Select GitHub as your Git provider
4. Select your master-blaster-audio-mastering repository
5. Configure build settings:
   - Build command: `npm run build:frontend`
   - Publish directory: `dist`
6. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

If you have Netlify CLI installed:

```bash
# Login to Netlify
netlify login

# Initialize a new Netlify site
netlify init

# Deploy the site
netlify deploy --prod
```

## Step 3: Configure Environment Variables

After deployment, go to your Netlify site settings:

1. Navigate to "Site settings" > "Environment variables"
2. Add the following variables:
   - `VITE_CONVEX_URL`: `https://famous-scorpion-680.convex.cloud`
   - `VITE_CLERK_PUBLISHABLE_KEY`: `pk_test_c3VyZS10ZXJyYXBpbi0xNS5jbGVyay5hY2NvdW50cy5kZXYk`

## Step 4: Configure Redirects

Netlify should automatically use the `_redirects` file in the public directory, but you can also configure redirects in the Netlify UI:

1. Go to "Site settings" > "Redirects"
2. Add a redirect rule:
   - From: `/*`
   - To: `/index.html`
   - Status: `200`

## Step 5: Test Your Deployment

1. Visit your Netlify site URL (e.g., https://your-site-name.netlify.app)
2. Verify that the landing page loads correctly
3. Test navigation and basic functionality

## Troubleshooting

If you encounter issues:

1. Check the Netlify deployment logs
2. Verify that environment variables are set correctly
3. Make sure the static files are properly copied to the dist directory
4. If the React app fails to load, the static landing.html page should be served as a fallback