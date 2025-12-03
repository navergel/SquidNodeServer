document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const zipSelectionElement = document.getElementById('zipSelection');
    const contentElement = document.getElementById('content');
    const successElement = document.getElementById('success');
    const errorMessageElement = document.querySelector('.error-message');
    const zipFileNameElement = document.getElementById('zipFileName');
    const zipFileInput = document.getElementById('zipFileInput');
    const settingsFieldsElement = document.getElementById('settingsFields');
    const upgradeFirmwareElement = document.getElementById('upgradeFirmware');
    const settingsForm = document.getElementById('settingsForm');
    const downloadButton = document.getElementById('downloadButton');
    const saveButton = document.getElementById('saveButton');
    const homeButton = document.getElementById('homeButton');
    
    // Global variables
    let currentZipFileName = '';
    let originalSettings = '';
    let currentZipFile = null;
    let jsZipInstance = null;
    
    // Editable parameters - these are the ones that will be displayed in the UI
    const editableParams = ['NetworkName', 'UseSSL', 'RVServer'];
    
    // RVServer credentials - in a real app, these would be securely stored
    const RVServerPassword = "[RVENC]CAB90B8B794D92C9201660E9821ABF7B06B45D14D3649BBFC4589AF4E6E672F1";
    const RVServerUser = "ReflectEdge";
    
    // Function to show error message
    function showError(message) {
        errorMessageElement.textContent = message;
        loadingElement.classList.add('hidden');
        errorElement.classList.remove('hidden');
        contentElement.classList.add('hidden');
        successElement.classList.add('hidden');
    }
    
    // Function to validate the form and enable/disable the Save Changes button
    function validateForm() {
        const rvServerInput = document.getElementById('RVServer');
        if (rvServerInput && rvServerInput.value.trim() !== '') {
            saveButton.disabled = false;
        } else {
            saveButton.disabled = true;
        }
    }
     
    // Function to create form fields 
    function createSettingsFields() {
        settingsFieldsElement.innerHTML = '';
        
        // Only display the editable parameters in the UI form
        for (const key of editableParams) {
            const value = "";
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group parameter-field';
            
            const label = document.createElement('label');
            label.setAttribute('for', key);
            label.textContent = key;
            
            let input;
            
            // Special handling for UseSSL parameter
            if (key === 'UseSSL') {
                input = document.createElement('select');
                
                const trueOption = document.createElement('option');
                trueOption.value = 'true';
                trueOption.textContent = 'true';
                
                const falseOption = document.createElement('option');
                falseOption.value = 'false';
                falseOption.textContent = 'false';
                falseOption.selected = true;   //default to false option
                
                input.appendChild(trueOption);
                input.appendChild(falseOption); 
                
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value;
            }
            
            input.id = key;
            input.name = key;
            input.classList.add('editable-field');
            
            // Create warning element for RVServer field
            let warningElement;
            if (key === 'RVServer') {
                warningElement = document.createElement('span');
                warningElement.id = 'rvserver-warning';
                warningElement.className = 'warning-text hidden';
                warningElement.textContent = '';
                
                // Add event listener to RVServer input to validate the form
                input.addEventListener('input', function(e) {
                    validateForm();
                    
                    // Check if the user is typing "http" and show/hide warning
                    const value = e.target.value.toLowerCase();
                    if (value.includes('http')) {
                        warningElement.textContent = 'Warning: do not use "http" in the rvserver field.';
                    } else {
                        warningElement.textContent = '';
                    }
                });
            }
            
            fieldDiv.appendChild(label);
            if (key === 'RVServer') {
                const labelContainer = document.createElement('div');
                labelContainer.style.display = 'flex';
                labelContainer.style.alignItems = 'center';
                labelContainer.appendChild(label);
                labelContainer.appendChild(warningElement);
                fieldDiv.appendChild(labelContainer);
            } else {
                fieldDiv.appendChild(label);
            }
            fieldDiv.appendChild(input);
            settingsFieldsElement.appendChild(fieldDiv);
        }
        
        // Initially disable the Save button until RVServer has a value
        saveButton.disabled = true;
    }
    
    // Function to handle zip file selection
    function handleZipFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        currentZipFileName = file.name;
        currentZipFile = file;
        
        // Show loading
        loadingElement.classList.remove('hidden');
        loadingElement.querySelector('p').textContent = 'Processing zip file...';
        zipSelectionElement.classList.add('hidden');
        
        // Process the zip file
        const reader = new FileReader();
        reader.onload = function(e) {
            processZipFile(e.target.result);
        };
        reader.onerror = function() {
            showError('Error reading the zip file');
        };
        reader.readAsArrayBuffer(file);
    }
    
    // Function to process the zip file
    async function processZipFile(arrayBuffer) {
        try {
            jsZipInstance = new JSZip();
            const zip = await jsZipInstance.loadAsync(arrayBuffer);
            
            // Look for Settings.js file
            const settingsEntry = zip.file('rvplayer/base/Settings.js') || zip.file('config/Settings.js');
            
            if (!settingsEntry) {
                throw new Error('Settings.js file not found in zip archive');
            }
            
            // Read the settings file content
            const settingsContent = await settingsEntry.async('string');
            originalSettings = settingsContent;
            
            // Update the UI
            zipFileNameElement.textContent = currentZipFileName;
            createSettingsFields();
            
            // Show the content
            loadingElement.classList.add('hidden');
            contentElement.classList.remove('hidden');
            
        } catch (error) {
            showError(error.message || 'Failed to process zip file');
            console.error('Error processing zip file:', error);
        }
    }
    
    // Function to remove lines with specific text from a string
    function removeLinesWithText(content, stringsToRemove) {
        const lines = content.split('\n');
        const updatedLines = lines.filter(line => {
            return !stringsToRemove.some(str => line.includes(str));
        });
        return updatedLines.join('\n');
    }
    
    // Function to add string at a specific line in a string
    function addStringToLine(content, stringToAdd, lineNumber) {
        const lines = content.split('\n');
        if (lineNumber > 0 && lineNumber <= lines.length) {
            lines.splice(lineNumber - 1, 0, stringToAdd);
            return lines.join('\n');
        }
        return content;
    }
    
    // Function to insert text at a specific position in a string
    function insertTextAt(originalString, textToInsert, position) {
        if (position < 0 || position > originalString.length) {
            return "Invalid position";
        }
        return originalString.slice(0, position) + textToInsert + originalString.slice(position);
    }
    
    // Save settings and create modified zip
    async function saveSettings(event) {
        event.preventDefault();
        
        try {
            if (!jsZipInstance || !currentZipFile) {
                throw new Error('No zip file loaded');
            }
            
            // Collect the editable parameter values from the form
            let editableParamValues = {};
            for (const param of editableParams) {
                const input = document.getElementById(param);
                if (input) {
                    let value = input.value;
                    
                    // Convert values for select elements
                    if (input.tagName === 'SELECT') {
                        value = value === 'true';
                    }
                    
                    editableParamValues[param] = value;
                }
            }
            
            // Get the settings content
            let settingsContent = originalSettings;
            
            // Remove lines with editable parameters
            settingsContent = removeLinesWithText(settingsContent, editableParams);
            
            // Create new settings parameters
            let newSettingsParams = "";
            let networkNameFile = "";
            
            // Update the editable parameters with the values from the UI
            for (const [key, value] of Object.entries(editableParamValues)) {
                if (key === 'NetworkName') {
                    networkNameFile = value;
                }
                
                if (key === 'UseSSL') {
                    newSettingsParams = newSettingsParams + `    "${key}": ${value},\n`;
                } else {
                    newSettingsParams = newSettingsParams + `    "${key}": "${value}",\n`;
                }
            }
            
            // Update RVServerUser and RVServerPassword
            newSettingsParams = newSettingsParams + `    "RVServerUser": "${RVServerUser}",\n`;
            newSettingsParams = newSettingsParams + `    "RVServerPassword": "${RVServerPassword}",`;
            
            // Add the new parameters to the settings content
            settingsContent = addStringToLine(settingsContent, newSettingsParams, 2);
            
            // Create a new zip file
            const newZip = new JSZip();
            
            // Copy all files from the original zip
            const zip = await JSZip.loadAsync(currentZipFile);
            
            // Add all files from the original zip to the new zip
            for (const [fileName, fileObj] of Object.entries(zip.files)) {
                if (!fileObj.dir) {
                    const content = await fileObj.async('arraybuffer');
                    // Preserve original file metadata to avoid security flags
                    newZip.file(fileName, content, {
                        date: fileObj.date,
                        unixPermissions: fileObj.unixPermissions || "644",
                        dosPermissions: fileObj.dosPermissions
                    });
                } else {
                    newZip.folder(fileName);
                }
            }
            
            // Add the updated Settings.js file with proper MIME type and no executable flag
            newZip.file('config/Settings.js', settingsContent, {
                date: new Date(),
                unixPermissions: "644", // Read/write for owner, read for group/others
                comment: "Settings file - not executable"
            });
            
            // Handle firmware upgrade if requested
            if (upgradeFirmwareElement.checked) {
                // Find firmware files
                for (const [fileName, fileObj] of Object.entries(zip.files)) {
                    if (fileName.startsWith('rvplayer/base/') && fileName.endsWith('.bsfw')) {
                        const baseFileName = fileName.split('/').pop();
                        const position = baseFileName.length - 5; // Position before .bsfw
                        const newFileName = insertTextAt(baseFileName, '-update', position);
                        
                        const content = await fileObj.async('arraybuffer');
                        newZip.file(newFileName, content);
                    }
                }
            }
            
            // Generate the new zip file with proper options to avoid security warnings
            const newZipContent = await newZip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9
                },
                platform: 'DOS',  // Use DOS/Windows compatibility
                comment: "Modified by Zip Settings Editor"
            });
            
            // Update the zip file name with network name if provided
            let newZipFileName = currentZipFileName;
            if (networkNameFile) {
                newZipFileName = networkNameFile + "_" + currentZipFileName;
            }
            
            // Store the blob for download
            window.modifiedZipBlob = newZipContent;
            window.modifiedZipFileName = newZipFileName;
            
            // Show success message
            contentElement.classList.add('hidden');
            successElement.classList.remove('hidden');
            
        } catch (error) {
            showError(error.message || 'Failed to save settings');
            console.error('Error saving settings:', error);
        }
    }
    
    // Download the modified zip
    function downloadModifiedZip() {
        if (window.modifiedZipBlob && window.modifiedZipFileName) {
            saveAs(window.modifiedZipBlob, window.modifiedZipFileName);
        } else {
            showError('No modified zip file available for download');
        }
    }
    
    // Function to reload to main page
    function goToHomePage() {
        window.location.reload();
    }
    
    // Event listeners
    zipFileInput.addEventListener('change', handleZipFileSelection);
    settingsForm.addEventListener('submit', saveSettings);
    downloadButton.addEventListener('click', downloadModifiedZip);
    homeButton.addEventListener('click', goToHomePage);
    
    // Initialize the application
    createSettingsFields();
});