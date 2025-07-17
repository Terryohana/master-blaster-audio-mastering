# Master Blaster Telegram Mini App

This is a Telegram Mini App for audio processing with EQ and compression capabilities. It's designed to be deployed to Netlify and integrated with Telegram.

## Features

- Audio file import from device
- Demo audio generation for testing
- Waveform visualization
- Audio playback controls
- 3-band EQ (low, mid, high) with visualization
- Basic compressor with threshold, ratio, and makeup gain
- Settings persistence using local storage
- Telegram UI integration

## Deployment Instructions

### Netlify Deployment

This branch is specifically set up for Netlify deployment. To deploy:

1. Fork or clone this repository
2. Connect your GitHub repository to Netlify
3. Configure the build settings:
   - Base directory: `telegram-mini-app-deploy`
   - Publish directory: `/`
   - Build command: (leave empty)

### Telegram Bot Setup

After deploying to Netlify, you'll need to set up a Telegram bot:

1. Open Telegram and chat with [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the instructions to create a bot
3. Send `/newapp` to create a Mini App for your bot
4. When asked for the URL, enter your Netlify URL (e.g., `https://your-site-name.netlify.app`)

## Local Development

To test locally before deploying:

1. Clone this repository
2. Navigate to the `telegram-mini-app-deploy` directory
3. Start a local server:
   ```
   python -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser

## Files

- `index.html` - The main HTML file
- `app.js` - The JavaScript code for audio processing
- `netlify.toml` - Configuration for Netlify deployment with proper headers for Telegram

## Notes

- This Mini App uses the Web Audio API for audio processing
- All processing happens client-side
- Settings are saved to local storage
- The app is designed to work within Telegram's Mini Apps platform