# Master Blaster Audio Mastering App

A professional audio mastering application that allows users to process audio tracks with high-quality EQ, compression, and other audio effects. The application provides both real-time processing and offline rendering capabilities.

## Features

- **Professional EQ**: 7-band equalizer with studio-quality presets designed by audio professionals
- **Dynamic Compression**: SSL-style compressor with presets for streaming platforms like Spotify and YouTube
- **Real-time Processing**: Hear changes instantly as you adjust settings, with visual feedback through VU meters
- **Project Management**: Save and load projects with all settings
- **Offline Rendering**: Process and download high-quality WAV files

## Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Convex (BaaS)
- **Authentication**: Clerk
- **Audio Processing**: Web Audio API

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with your Convex and Clerk credentials
4. Start the development server: `npm run dev`

## Deployment

This project is deployed on Netlify and uses Convex for the backend.

## License

All rights reserved.