const express = require('express');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const AdmZip = require('adm-zip');
const { spawn } = require('child_process');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Define paths
const ARCHIVES_DIR = path.join(__dirname, 'archives');
const TEMP_DIR = path.join(__dirname, 'temp');

// Editable parameters - these are the ones that will be displayed in the UI
const editableParams = ['NetworkName', 'UseSSL', 'RVServer'];
//todo: instead of storing password/user here, we could put in Environment variables and read from there
const RVServerPassword = "[RVENC]CAB90B8B794D92C9201660E9821ABF7B06B45D14D3649BBFC4589AF4E6E672F1";
const RVServerUser = "ReflectEdge";

// Create necessary directories if they don't exist
fs.ensureDirSync(ARCHIVES_DIR);
fs.ensureDirSync(TEMP_DIR);

// Route to get the list of available zip files
app.get('/api/zipfiles', async (req, res) => {
  try {
    const files = await fs.readdir(ARCHIVES_DIR);
    const zipFiles = files.filter(file => file.toLowerCase().endsWith('.zip'));
    
    /*if (zipFiles.length === 0) {
      return res.status(404).json({ error: 'No zip files found in archives directory' });
    }*/
    
    res.json({ zipFiles });
  } catch (error) {
    console.error('Error reading archives directory:', error);
    res.status(500).json({ error: 'Failed to read archives directory' });
  }
});

// Route to get the settings from a specific zip file
app.get('/api/settings/:zipFileName', async (req, res) => {
  try {
    const { zipFileName } = req.params;
    
    // Clean up temp directory
    await fs.emptyDir(TEMP_DIR);
    
    const zipPath = path.join(ARCHIVES_DIR, zipFileName);
    const tempZipPath = path.join(TEMP_DIR, zipFileName);
    
    // Check if the zip file exists
    if (!await fs.pathExists(zipPath)) {
      return res.status(404).json({ error: 'Zip file not found in archives directory' });
    }
    
    // Copy the zip file to the temp directory
    await fs.copy(zipPath, tempZipPath);
    
    // Extract the settings file
    const zip = new AdmZip(tempZipPath);
    const settingsEntry = zip.getEntry('rvplayer/base/Settings.js');
    
    if (!settingsEntry) {
      return res.status(404).json({ error: 'Settings.js file not found in zip archive' });
    }
    
    // Read the settings file content
    const settingsContent = settingsEntry.getData().toString('utf8');
    //console.log('nv server.js:Settings Content:', settingsContent);

    // Extract the Setting.js file to the temp directory
    const tempSettingsPath = path.join(TEMP_DIR, 'Settings.js');
    fs.writeFileSync(tempSettingsPath, settingsContent);
    
    // Return the settings content and the name of the zip file
    res.json({ 
      settings: settingsContent,
      zipFileName: zipFileName
    });
  } catch (error) {
    console.error('Error processing zip file:', error);
    res.status(500).json({ error: 'Failed to process zip file' });
  }
});

// Keeping the original endpoint for backward compatibility
app.get('/api/settings', async (req, res) => {
  try {
    // Find the first zip file in the archives directory
    const files = await fs.readdir(ARCHIVES_DIR);
    const zipFile = files.find(file => file.toLowerCase().endsWith('.zip'));
    
    if (!zipFile) {
      return res.status(404).json({ error: 'No zip file found in archives directory' });
    }
    
    // Redirect to the specific zip file endpoint
    res.redirect(`/api/settings/${zipFile}`);
  } catch (error) {
    console.error('Error finding zip file:', error);
    res.status(500).json({ error: 'Failed to find zip file' });
  }
});

// Route to save modified settings and create new zip
app.post('/api/save', async (req, res) => {
  let networkNameFile = "";  //used for prepend zip filename with networkName

  try {
    const { zipFileName, editableParamValues, upgradeFirmware } = req.body;
    
    if (!zipFileName || !editableParamValues) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const tempZipPath = path.join(TEMP_DIR, zipFileName);
    const tempSettingsPath = path.join(TEMP_DIR, 'Settings.js');
    
    // Check if the temp zip file exists
    if (!await fs.pathExists(tempZipPath)) {
      return res.status(404).json({ error: 'Temporary zip file not found' });
    }
    
    // Check if the temp Setting.js file exists
    if (!await fs.pathExists(tempSettingsPath)) {
      return res.status(404).json({ error: 'Temporary Settings.js file not found' });
    }
    
    //nv test removing lines from settings files
    try { 
        removeLinesWithText(tempSettingsPath, editableParams);
        //console.log('Lines with'+editableParams+ ' removed successfully.');
    } catch (error) {
        console.error('Error removing lines:', error);
    }


    
    
    
    // Parse the settings content to get the settings object
    let newSettingsParams = "";
    
    // Update the editable parameters with the values from the UI
    if (editableParamValues) {
      for (const [key, value] of Object.entries(editableParamValues)) {
        if (key !== 'upgradeFirmware') {
          if (key === 'NetworkName')
          {
            networkNameFile = value;
          }

          if (key === 'UseSSL')
          {
            newSettingsParams = newSettingsParams + "    \"" + [key] + "\": " + value + ",\n";  
          } else {
            newSettingsParams = newSettingsParams + "    \"" + [key] + "\": \"" + value + "\",\n";
            
          }
        }
      }
    }
    
    // Update RVServerUser and RVServerPassword
    newSettingsParams = newSettingsParams + "    \"RVServerUser\": \"" + RVServerUser + "\",\n";
    newSettingsParams = newSettingsParams + "    \"RVServerPassword\": \"" + RVServerPassword + "\",";
    
    
    //console.log("nv server.js::/api/save: newSettingsParams:"+ newSettingsParams);
    //nv test removing lines from settings files
    try { 
      addStringToLine(tempSettingsPath, newSettingsParams, 2);
      
  } catch (error) {
      console.error('Error adding new params to settings file:', error);
  }

    // Write the updated settings to the temporary file
    //fs.writeFileSync(tempSettingsPath, cleanSettingsContent, 'utf8');
    


    // Open the zip file
    const zip = new AdmZip(tempZipPath);
    
    // Add the updated Setting.js file to the config folder in the zip
    //console.log('nv server.js:api/save - tempSettingPath:'+tempSettingsPath);
    zip.addLocalFile(tempSettingsPath,'config/');

    // Handle firmware upgrade if requested
    if (upgradeFirmware === true) {
      // Find firmware files
      const entries = zip.getEntries();
      const firmwareEntries = entries.filter(entry => 
        entry.entryName.startsWith('rvplayer/base/') && 
        entry.entryName.endsWith('.bsfw')
      );
      
      // Copy firmware files to root with "update-" prefix
      for (const entry of firmwareEntries) {
        const fileName = path.basename(entry.entryName);
        const position = fileName.length - 5; //this should be position  before the .bsfw
        
        //const newFileName = `update-${fileName}`;
        const newFileName = insertTextAt(fileName, '-update', position);
        const fileData = entry.getData();
        
        zip.addFile(newFileName, fileData);
      }
    }
    
    // Save the modified zip
    zip.writeZip(tempZipPath);
    

    // Rename archive to append networkName
    let newZipFileName = zipFileName;
    if (networkNameFile) {
      newZipFileName = networkNameFile+"_"+zipFileName;
      fs.rename(tempZipPath, path.join(TEMP_DIR,newZipFileName));
      
    }
    
    

    // Return success
    res.json({ success: true, newZipFileName });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

function insertTextAt(originalString, textToInsert, position) {
  if (position < 0 || position > originalString.length) {
    return "Invalid position";
  }
  return originalString.slice(0, position) + textToInsert + originalString.slice(position);
}

/**
 * Removes lines containing a specified string from a file.
 *
 * @param {string} filePath - The path to the file.
 * @param {string} stringsToRemove - The strings to search for and remove lines containing it.
 * 
 */
function removeLinesWithText(filePath, stringsToRemove) {
  try {
    
    
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');

      const updatedLines = lines.filter(line => {
        return !stringsToRemove.some(str => line.includes(str));
      });
      fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf-8');
      //console.log('Lines removed successfully.');
  } catch (error) {
        console.error('An error occurred:', error);
  }
      

}


function addStringToLine(filePath, stringToAdd, lineNumber) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split(os.EOL);

    if (lineNumber > 0 && lineNumber <= lines.length) {
      lines.splice(lineNumber - 1, 0, stringToAdd);
      const updatedContent = lines.join(os.EOL);
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
    } else {
      console.error(`Invalid line number: ${lineNumber}. File has ${lines.length} lines.`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}


// Route to handle search build (call Python script)
app.post('/api/search-build', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    // Path to your Python script
    const pythonScriptPath = "C:\\Users\\nelson.vergel\\OneDrive - Creative Realities Inc\\Documents\\QADevelopment\\JIRA_BS_ArchiveDownloader\\jira_attachment_downloader.py";
    const scriptDir = path.dirname(pythonScriptPath);
    const scriptName = path.basename(pythonScriptPath);
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      return res.status(404).json({ error: 'Python script not found' });
    }
    
    console.log("pythonScriptPath:"+pythonScriptPath);
    console.log("searchTerm:"+searchTerm);
    console.log("scriptDir:"+scriptDir);
    
    // Execute Python script with the search term as argument, running from script directory
    const pythonProcess = spawn('python', [scriptName, searchTerm], { cwd: scriptDir });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        // Success
        res.json({ success: true, message: stdout.trim() });
      } else {
        // Error
        const errorMessage = stderr.trim() || stdout.trim() || `Python script exited with code ${code}`;
        res.status(500).json({ error: errorMessage });
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Error executing Python script:', error);
      res.status(500).json({ error: `Failed to execute Python script: ${error.message}` });
    });
    
  } catch (error) {
    console.error('Error in search build endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to download the modified zip
app.get('/api/download/:zipFileName', (req, res) => {
  const { zipFileName } = req.params;
  const tempZipPath = path.join(TEMP_DIR, zipFileName);
  
  // Check if the file exists
  if (!fs.existsSync(tempZipPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename=${zipFileName}`);
  res.setHeader('Content-Type', 'application/zip');
  
  // Stream the file to the response
  const fileStream = fs.createReadStream(tempZipPath);
  fileStream.pipe(res);
  
  // Clean up temp directory after download completes
  fileStream.on('end', async () => {
    try {
      // Wait a bit to ensure download is complete before cleanup
      setTimeout(async () => {
        await fs.emptyDir(TEMP_DIR);
        console.log('Temporary files cleaned up');
      }, 1000);
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Archives directory: ${ARCHIVES_DIR}`);
  console.log(`Temporary directory: ${TEMP_DIR}`);
});





