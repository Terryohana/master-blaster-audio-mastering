# Deploying to Netlify

Follow these steps to deploy your Master Blaster application to Netlify:

## Step 1: Log in to Netlify

1. Go to [https://app.netlify.com/](https://app.netlify.com/)
2. Log in with your Netlify account (or create one if you don't have it)

## Step 2: Create a new site from Git

1. Click on the "Add new site" button
2. Select "Import an existing project"
3. Choose "GitHub" as your Git provider

## Step 3: Authorize Netlify

1. Authorize Netlify to access your GitHub repositories
2. Select the "master-blaster-audio-mastering" repository

## Step 4: Configure build settings

1. Configure the build settings:
   - Branch to deploy: `main`
   - Base directory: (leave blank)
   - Build command: `npm run build`
   - Publish directory: `dist`

2. Click "Show advanced" and add the following environment variables:
   - `VITE_CONVEX_URL`: `https://famous-scorpion-680.convex.cloud`
   - `VITE_CLERK_PUBLISHABLE_KEY`: `pk_test_c3VyZS10ZXJyYXBpbi0xNS5jbGVyay5hY2NvdW50cy5kZXYk`

3. Click "Deploy site"

## Step 5: Wait for deployment

1. Netlify will start building and deploying your site
2. This process usually takes 1-3 minutes

## Step 6: Configure your site

1. Once deployed, click on "Site settings"
2. You can change your site name under "Site information"
3. Your site will be available at `https://your-site-name.netlify.app`

## Step 7: Configure Convex and Clerk

1. Go to your Convex dashboard and add your Netlify domain to allowed origins
2. Go to your Clerk dashboard and add your Netlify domain to allowed origins

## Step 8: Test your deployed application

1. Visit your Netlify site URL
2. Test all functionality to ensure everything works correctly

## Troubleshooting

If you encounter any issues:

1. Check the Netlify deployment logs
2. Verify your environment variables are set correctly
3. Make sure your Convex and Clerk configurations include your Netlify domain