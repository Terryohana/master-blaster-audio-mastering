# Deploying Schema Changes to Convex

Follow these steps to deploy your schema changes to your Convex deployment:

## 1. Log in to Convex

Open a terminal and run:

```bash
npx convex login
```

Follow the prompts to log in to your Convex account.

## 2. Deploy Schema Changes

After logging in, run:

```bash
npx convex deploy
```

This will deploy your schema changes to your production deployment.

## 3. Verify Deployment

To verify that your changes were deployed successfully, run:

```bash
npx convex dash
```

This will open the Convex dashboard in your browser, where you can check your schema and data.

## 4. Testing Authentication

1. Start your development server:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

3. You should now see the Clerk authentication UI and be able to sign in or sign up.

## Troubleshooting

If you encounter any issues:

1. Check that your Clerk API keys are correctly set in `.env.local`
2. Verify that your Convex deployment ID is correct
3. Check the browser console for any errors
4. Restart your development server