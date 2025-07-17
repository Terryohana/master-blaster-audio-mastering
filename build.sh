#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

# Output success message
echo "Build completed successfully!"
echo "The build output is in the 'dist' directory."