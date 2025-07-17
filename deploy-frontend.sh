#!/bin/bash

# This script deploys only the frontend to Netlify

# Build the frontend
echo "Building the frontend..."
npm run build:frontend

# Copy static files to the dist directory
echo "Copying static files..."
cp -r public/* dist/

# Output success message
echo "Frontend build completed successfully!"
echo "The build output is in the 'dist' directory."
echo "You can now deploy this directory to Netlify."