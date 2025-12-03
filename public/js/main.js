

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const zipSelectionElement = document.getElementById('zipSelection');
    const contentElement = document.getElementById('content');
    const successElement = document.getElementById('success');
    const errorMessageElement = document.querySelector('.error-message');
    const zipFileNameElement = document.getElementById('zipFileName');
    const zipFilesListElement = document.getElementById('zipFilesList');
    const searchBuildButton = document.getElementById('searchBuildButton');
    const editableParamsListElement = document.getElementById('editableParamsList');
    const settingsFieldsElement = document.getElementById('settingsFields');
    const upgradeFirmwareElement = document.getElementById('upgradeFirmware');
    const settingsForm = document.getElementById('settingsForm');
    const downloadButton = document.getElementById('downloadButton');
    const saveButton = document.getElementById('saveButton');
    const homeButton = document.getElementById('homeButton');
    
    let archiveDownloadScript = "C:\Users\nelson.vergel\OneDrive - Creative Realities Inc\Documents\QADevelopment\JIRA_BS_ArchiveDownloader\jira_attachment_downloader.py";

    // Global variables
    let currentZipFileName = '';
    let originalSettings = '';
    let selectedZipFile = null;
    
    // Editable parameters - these are the ones that will be displayed in the UI
    const editableParams = ['NetworkName', 'UseSSL', 'RVServer'];
    
    // Function to show error message
    function showError(message) {
        errorMessageElement.textContent = message;
        loadingElement.classList.add('hidden');
        errorElement.classList.remove('hidden');
        zipSelectionElement.classList.add('hidden');
        contentElement.classList.add('hidden');
        successElement.classList.add('hidden');
    }
    
    // Function to validate the form and enable/disable the Save Changes button
    function validateForm() {
        const rvServerInput = document.getElementById('RVServer');
        if (rvServerInput && rvServerInput.value.trim() !== '' ) {
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
                            //warningElement.classList.add('hidden');
                            warningElement.textContent = 'Warning: do not use "http" in the rvserver field.';
                        } else {
                            //warningElement.classList.remove('hidden');
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
    
    
    // Function to load available zip files
    async function loadZipFiles() {
        try {
            const response = await fetch('/api/zipfiles');
        
            if (!response.ok) {
               const errorData = await response.json();
               throw new Error(errorData.error || 'Failed to load zip files');
            }
        
            const data = await response.json();
            const zipFiles = data.zipFiles;
        
            zipFilesListElement.innerHTML = '';
            
            if (zipFiles.length === 0) {
                const noBuildsItem = document.createElement('li');
                noBuildsItem.textContent = 'No builds available';
                zipFilesListElement.appendChild(noBuildsItem);
            } else {
                for (const zipFile of zipFiles) {
               const listItem = document.createElement('li');
               listItem.className = 'zip-file-item';
            
               // Create container div for file name and button
               const container = document.createElement('div');
               container.style.display = 'flex';
               container.style.justifyContent = 'space-between';
               container.style.alignItems = 'center';
            
               // Add file name span
               const fileNameSpan = document.createElement('span');
               fileNameSpan.textContent = zipFile;
            
               // Add load button
               const loadButton = document.createElement('button');
               loadButton.textContent = 'Load';
               loadButton.className = 'load-zip-button';
            
               // Add click event to load the zip file
               loadButton.addEventListener('click', () => {
                  selectedZipFile = zipFile;
                  loadSettings();
                });
            
                container.appendChild(fileNameSpan);
                container.appendChild(loadButton);
                listItem.appendChild(container);
                zipFilesListElement.appendChild(listItem);
                }
            }
        
            // Show the zip selection section
            loadingElement.classList.add('hidden');
            zipSelectionElement.classList.remove('hidden');
        
        } catch (error) {
            showError(error.message);
            console.error('Error loading zip files:', error);
        }
    }
   

    // Function to load settings from the selected zip file
    async function loadSettings() {
        try {
            if (!selectedZipFile) {
                throw new Error('No zip file selected');
            }
            
            // Show loading
            zipSelectionElement.classList.add('hidden');
            loadingElement.classList.remove('hidden');
            loadingElement.querySelector('p').textContent = 'Loading settings from selected zip file...';
            
            const response = await fetch(`/api/settings/${selectedZipFile}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load settings');
            }
            
            const data = await response.json();
            
            // Store the zip file name and settings
            currentZipFileName = data.zipFileName;
            originalSettings = data.settings;
            
            // Update the UI
            zipFileNameElement.textContent = currentZipFileName;
            createSettingsFields();
           
            
            // Show the content
            loadingElement.classList.add('hidden');
            contentElement.classList.remove('hidden');
            
        } catch (error) {
            showError(error.message);
            console.error('Error loading settings:', error);
        }
    }
    
    // Save settings and create modified zip
    async function saveSettings(event) {
        event.preventDefault();
        
        try {

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

            // Prepare the request data
            const requestData = {
                zipFileName: currentZipFileName,
                editableParamValues: editableParamValues,
                upgradeFirmware: upgradeFirmwareElement.checked
            };
            
            // Send the request to save the settings
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save settings');
            }
            
            //update zipFileName for download 
            const data = await response.json();
            currentZipFileName = data.newZipFileName;
            


            
            
            // Show success message
            contentElement.classList.add('hidden');
            successElement.classList.remove('hidden');
            
        } catch (error) {
            showError(error.message);
            console.error('Error saving settings:', error);
        }
    }

    // Function to search build by calling python script
    async function searchBuild() {
        try {
            const input = document.getElementById("buildNumInput");
            const searchTerm = input.value.trim();

            console.log("searchTerm:"+searchTerm+" calling script");
            
            if (!searchTerm) {
                showError('Please enter a search term');
                return;
            }
            
            // Disable all buttons and show notification
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach(btn => btn.disabled = true);
            
            // Show loading with user notification
            zipSelectionElement.classList.add('hidden');
            loadingElement.classList.remove('hidden');
            loadingElement.querySelector('p').textContent = 'Downloading build... Please be patient. Page will reload when complete.';
            
            // Call the Python script via API
            const response = await fetch('/api/search-build', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ searchTerm: searchTerm })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Success - reload home page
                window.location.href = '/';
            } else {
                // Error - show the error message
                const errorMessage = data.error || 'Unknown error occurred';
                showError(errorMessage);
            }
            
        } catch (error) {
            showError(`Network error: ${error.message}`);
            console.error('Error in searchBuild:', error);
        } finally {
            // Re-enable all buttons
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach(btn => btn.disabled = false);
        }
    }

    // Download the modified zip
    function downloadModifiedZip() {
        window.location.href = `/api/download/${currentZipFileName}`;
    }
    
    // Function to reload to main page
    function goToHomePage() {
        window.location.href = '/';
    }
    
    // Event listeners
    searchBuildButton.addEventListener('click', searchBuild);
    settingsForm.addEventListener('submit', saveSettings);
    downloadButton.addEventListener('click', downloadModifiedZip);
    homeButton.addEventListener('click', goToHomePage);
    
    // Initialize the application
    loadZipFiles();
});