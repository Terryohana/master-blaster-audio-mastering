# Understanding the CORS Error

## What is CORS?

CORS (Cross-Origin Resource Sharing) is a security feature implemented by browsers that restricts web pages from making requests to a different domain than the one that served the original page.

## The Error You Encountered

```
Access to script at 'file:///C:/Users/Dell/Documents/Master%20Blaster%204.0/amazon-q-mcp.js' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-extension, chrome-untrusted, data, http, https, isolated-app.
```

This error occurs because:

1. You're opening the HTML file directly from your file system (using the `file://` protocol)
2. The HTML file is trying to import a JavaScript module from another file
3. Browsers block this for security reasons when using the `file://` protocol

## Solutions

### Solution 1: Use the Embedded Version (Simplest)

I've created a new file called `run-mcp-demo-embedded.html` that has the entire MCP class embedded directly in the HTML file. This avoids the need for module imports and should work when opened directly in your browser.

### Solution 2: Use a Local Web Server

If you want to keep the files separate, you can run a local web server:

#### Using Python (if installed):

1. Open a command prompt in your project directory
2. Run one of these commands:
   - Python 3: `python -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
3. Open your browser and go to `http://localhost:8000/run-mcp-demo.html`

#### Using Node.js (if installed):

1. Install a simple server: `npm install -g http-server`
2. Run it in your project directory: `http-server`
3. Open your browser and go to the URL shown in the terminal

### Solution 3: Use a Modern IDE with Built-in Server

Many modern IDEs like VS Code have built-in servers or extensions that can serve your files locally:

- VS Code: Install the "Live Server" extension
- WebStorm/IntelliJ: Use the built-in web server

## Why This Happens

This security restriction exists to prevent potentially malicious local files from accessing other files on your system through JavaScript. When you use a web server (even a local one), the browser treats the files as coming from a web origin rather than from your file system, which is considered safer.

## For Your Master Blaster App

In a production environment, this won't be an issue because:

1. Your app will be served from a proper web server
2. All resources will be loaded from the same origin or with proper CORS headers
3. Module imports will work correctly

For now, use the embedded version (`run-mcp-demo-embedded.html`) for testing the MCP implementation.