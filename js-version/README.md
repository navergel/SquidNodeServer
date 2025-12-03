# Zip Settings Editor (JavaScript Version)

This is a client-side JavaScript version of the Zip Settings Editor application that works without Node.js. It allows you to edit settings in zip archives directly in your browser.

## Features

- Upload and process zip files directly in the browser
- Edit settings parameters (NetworkName, UseSSL, RVServer)
- Option to update firmware
- Download the modified zip file
- Preserves file permissions to avoid Windows security warnings

## How to Use

1. Open `index.html` in a web browser
2. Click "Select a Zip File" and choose a zip file from your computer
3. Edit the settings as needed
4. Check "Update Firmware" if you want to include firmware updates
5. Click "Save Changes"
6. Click "Download Modified Zip" to download the modified zip file

## Technical Details

This application uses:
- JSZip library for zip file processing
- FileSaver.js for downloading files
- Pure client-side JavaScript (no server required)

## Browser Compatibility

This application works in modern browsers that support:
- File API
- Promises
- Async/Await
- Blob objects

## Differences from the Node.js Version

- All processing happens in the browser instead of on a server
- Files are selected from the user's computer rather than from a server directory
- No need for Express or other server-side dependencies
- No persistent storage between sessions