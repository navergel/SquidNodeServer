

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
    const settingsFieldsElement = document.getElementById('settingsFields');
    const upgradeFirmwareElement = document.getElementById('upgradeFirmware');
    const settingsForm = document.getElementById('settingsForm');
    const downloadButton = document.getElementById('downloadButton');
    const saveButton = document.getElementById('saveButton');
    const homeButton = document.getElementById('homeButton');
    const archiveSelectionElement = document.getElementById('archiveSelection');
    const archiveListElement = document.getElementById('archiveList');
    const downloadArchivesButton = document.getElementById('downloadArchivesButton');

    // Global variables
    let currentZipFileName = '';
    let originalSettings = '';
    let selectedZipFile = null;
    
    // Editable parameters - these are the ones that will be displayed in the UI
    const editableParams = ['NetworkName', 'UseSSL', 'RVServer', 'RebootOnError', 'WiFiSSID', 'WiFiPass', 'WiFiIPConfig',
        'Rotation', 'VideoRotation', 'AdServer', 'ScreenshotInterval', 'ProfileInterval', 'ChannelInterval', 'DiagnosticMode', 'DiagnosticPwd',
        'PersistentRemoteConsole','AppVideoDecoder','ScreenLayout','ScreenBezelPixels'
    ];
    
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
    function createSettingsFields(originalSettings) {
        settingsFieldsElement.innerHTML = '';
        
        // Define sections and their fields
        const sections = {
            'Server Configuration': ['RVServer', 'UseSSL'],
            'Playback': ['Rotation','VideoRotation','ScreenLayout','ScreenBezelPixels','AppVideoDecoder'],
            'Communication': ['AdServer','ScreenshotInterval', 'ProfileInterval', 'ChannelInterval'],
            'Networking': ['NetworkName', 'WiFiSSID', 'WiFiPass', 'WiFiIPConfig'],
            'System': ['RebootOnError', 'DiagnosticMode', 'DiagnosticPwd', 'PersistentRemoteConsole'],
        };
        

        // Create grid container
        const gridContainer = document.createElement('div');
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = '1fr 1fr';
        gridContainer.style.gridTemplateRows = 'auto auto auto';
        gridContainer.style.gap = '20px';
        
        // Create each section
        for (const [sectionName, fields] of Object.entries(sections)) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'settings-section';
            sectionDiv.style.backgroundColor = '#f5f5f5';
            sectionDiv.style.padding = '15px';
            sectionDiv.style.borderRadius = '8px';
            sectionDiv.style.border = '1px solid #ddd';
            
            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = sectionName;
            sectionDiv.appendChild(sectionTitle);
            
            // Add fields for this section
            for (const key of fields) {
                const value = "";
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'form-group parameter-field';
                
                const label = document.createElement('label');
                label.setAttribute('for', key);
                label.textContent = key;
                
                let input;
                
                // Special handling for UseSSL parameter
                if (key === 'UseSSL' ) {
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    //input.defaultValue = false;

                } else if (key === 'RebootOnError') {
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    //input.defaultValue = true;
                    input.checked = true;
                } else if (key === 'DiagnosticMode') {
                    input = document.createElement('input');
                    input.type = 'checkbox';

                } else if (key === "ProfileInterval") {
                    input = document.createElement('input');
                    input.type = 'number';
                    input.min = '60';
                    input.max = '3600';
                    input.defaultValue = '1800';
                    input.placeholder = '1800';
                    input.onmouseover = function() {
                        this.title = 'Enter interval in seconds (60 to 3600)';
                    }
                    input.value = value;
                } else if (key === "ChannelInterval") {
                    input = document.createElement('input');
                    input.type = 'number';
                    input.min = '10';
                    input.max = '600';
                    input.defaultValue = '60';
                    input.placeholder = '60';
                    input.onmouseover = function() {
                        this.title = 'Enter interval in seconds (10 to 600)';
                    }
                    input.value = value;
                } else if (key === "ScreenshotInterval") {
                    input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.max = '60';
                    input.defaultValue = '0';
                    input.placeholder = '0';
                    input.onmouseover = function() {
                        this.title = 'Enter interval in minutes (0 to disable)';
                    }
                    input.value = value;
                } else if (key === "Rotation") {
                    input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.max = '270';
                    input.step = '90';
                    input.defaultValue = '0';
                    input.placeholder = '0';
                    input.onmouseover = function() {
                        this.title = 'Enter rotation in degrees (0, 90, 180, or 270)';
                    }
                    input.value = value;
                } else if (key === "VideoRotation") {
                    input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.max = '270';
                    input.defaultValue = '0';
                    input.placeholder = '0';
                    input.onmouseover = function() {
                        this.title = 'Enter rotation in degrees (0, 90, 180, or 270)';
                    }
                    input.step = '90';
                    input.value = value;
                } else if (key === "WiFiIPConfig") {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = 'dhcp';
                    input.onmouseover = function() {
                        this.title = 'Enter "dhcp" for automatic IP configuration or "ip|subnet|gateway|broadcast|dns1|dns2|dns3" for static IP configuration.';
                    }
                    input.value = value;
                    input.defaultValue = 'dhcp';
                } else if (key === 'PersistentRemoteConsole') {
                    input = document.createElement('input');
                    input.type = 'checkbox';

                    if(!originalSettings.includes(key)) {
                        input.disabled = true;
                        input.onmouseover = function() {
                        this.title = 'This parameter is not supported in the current build.'; }
                    }
                } else if (key === 'AppVideoDecoder') {
                    input = document.createElement('select');

                    const brightSignOption = document.createElement('option');
                    brightSignOption.value = 'brightsign';
                    brightSignOption.textContent = 'brightsign';

                    const browserOption = document.createElement('option');
                    browserOption.value = 'browser';
                    browserOption.textContent = 'browser';
                    
                    const autoOption = document.createElement('option');
                    autoOption.value = 'auto';
                    autoOption.textContent = 'auto';
                    autoOption.selected = true;

                    input.appendChild(brightSignOption);
                    input.appendChild(browserOption);
                    input.appendChild(autoOption);

                    if(!originalSettings.includes(key)) {
                        input.disabled = true;
                        input.onmouseover = function() {
                        this.title = 'This parameter is not supported in the current build.'; }
                    }

                } else if (key === 'ScreenLayout') {
                    input = document.createElement('select');
                    
                    const horizontalOption = document.createElement('option');
                    horizontalOption.value = 'horizontal';
                    horizontalOption.textContent = 'horizontal';

                    const verticalOption = document.createElement('option');
                    verticalOption.value = 'vertical';
                    verticalOption.textContent = 'vertical';
                    
                    const gridOption = document.createElement('option');
                    gridOption.value = 'grid';
                    gridOption.textContent = 'grid';
                    
                    const disabledOption = document.createElement('option');
                    disabledOption.value = 'disabled';
                    disabledOption.textContent = 'disabled';
                    disabledOption.selected = true;

                    input.appendChild(horizontalOption);
                    input.appendChild(verticalOption);
                    input.appendChild(gridOption);
                    input.appendChild(disabledOption);

                    if(!originalSettings.includes(key)) {
                        input.disabled = true;
                        input.onmouseover = function() {
                        this.title = 'This parameter is not supported in the current build.'; }
                    }

                } else if (key === "ScreenBezelPixels") {
                    input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.defaultValue = '0';
                    input.placeholder = '0';
                    
                    input.value = value;
                    if(!originalSettings.includes(key)) {
                        input.disabled = true;
                        input.onmouseover = function() {
                            this.title = 'This parameter is not supported in the current build.'; }
                    } else {
                        input.onmouseover = function() {
                            this.title = 'Screen Bezel size in pixels';}
                    }
                } else {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.value = value;
                }
                
                input.id = key;
                input.name = key;
                input.classList.add('editable-field');
                
                // Add red border for RVServer field
                if (key === 'RVServer') {
                    input.style.border = '2px solid red';
                }
                
                // Create warning element for RVServer field
                let warningElement;
                if (key === 'RVServer') {
                    warningElement = document.createElement('span');
                    warningElement.id = 'rvserver-warning';
                    warningElement.className = 'warning-text hidden';
                    warningElement.textContent = '';
                    
                    input.addEventListener('input', function(e) {
                        validateForm();
                        
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
                sectionDiv.appendChild(fieldDiv);
            }
            
            gridContainer.appendChild(sectionDiv);
        }
        
        settingsFieldsElement.appendChild(gridContainer);
        
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
            createSettingsFields(originalSettings);
           
            
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

            saveButton.disabled = true;

            // Collect the editable parameter values from the form
            let editableParamValues = {};
            for (const param of editableParams) {
                const input = document.getElementById(param);
                if (input && !input.disabled) {   
                    let value = input.value;
                    
                    if (input.name === 'ScreenshotInterval') {
                        value = parseInt(input.value) * 60;

                    }
                    // Convert values for boolean elements
                    if (input.type === 'checkbox') {
                        value = input.checked;
                    }

                    if (input.value === '') {
                        value = input.defaultValue;
                    }
                    
                    editableParamValues[param] = value;
                }
            }
            //console.log("nv saveSettings:editableParamValues:"+JSON.stringify(editableParamValues));
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
            saveButton.disabled = false;
            
        } catch (error) {
            showError(error.message);
            console.error('Error saving settings:', error);
        }
    }

    // Function to search build by calling python script
    // no currently used
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

    // Function to list archives for build by calling python script
    async function listArchives() {
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
            loadingElement.querySelector('p').textContent = 'Searching for build archives... Please be patient.';
            
            // Call the Python script via API
            const response = await fetch('/api/list-archives', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ searchTerm: searchTerm })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log("script response:"+data.message);
                displayArchiveSelection(data.message);
            } else {
                // Error - show the error message
                const errorMessage = data.error || 'Unknown error occurred';
                showError(errorMessage);
            }
            
        } catch (error) {
            showError(`Network error: ${error.message}`);
            console.error('Error in listArchives:', error);
        } finally {
            // Re-enable all buttons
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach(btn => btn.disabled = false);
        }
    }

    // Display archive selection form
    function displayArchiveSelection(archivesText) {
        const cleanText = archivesText.replace(/\\n/g, '\n').replace(/\r/g, '');
        const archives = cleanText.split('\n').filter(line => line.trim() !== '');
        
        archiveListElement.innerHTML = '';
        
        archives.forEach((archive, index) => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'form-group checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `archive-${index}`;
            checkbox.value = archive;
            checkbox.addEventListener('change', updateDownloadButton);
            
            const label = document.createElement('label');
            label.setAttribute('for', `archive-${index}`);
            label.textContent = archive;
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            archiveListElement.appendChild(checkboxDiv);
        });
        
        loadingElement.classList.add('hidden');
        archiveSelectionElement.classList.remove('hidden');
    }
    
    // Update download button state
    function updateDownloadButton() {
        const checkboxes = document.querySelectorAll('#archiveList input[type="checkbox"]');
        const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
        downloadArchivesButton.disabled = !anyChecked;
    }
    
    // Download selected archives
    async function downloadSelectedArchives() {
        const checkboxes = document.querySelectorAll('#archiveList input[type="checkbox"]:checked');
        const selectedArchives = Array.from(checkboxes).map(cb => cb.value);
        
        // Disable all buttons and show notification
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(btn => btn.disabled = true);
            
        // Show loading with user notification
        archiveSelectionElement.classList.add('hidden');
        loadingElement.classList.remove('hidden');
        loadingElement.querySelector('p').textContent = 'Downloading build(s)... Please be patient. Page will reload when complete.';
            

        console.log('Selected archives:', selectedArchives);
        
        for (const issueArchive of selectedArchives) {
            const [issue, archive] = issueArchive.split(':');

            const requestData = {
                issue: issue,
                archive: archive
            };

            const response = await fetch('/api/download-archive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log("download-archive script response:"+data.message);
                window.location.href = '/';  //reload home page
            } else {
                const errorMessage = data.error || 'Unknown error occurred';
                showError(errorMessage);
            }
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
    //searchBuildButton.addEventListener('click', searchBuild);
    searchBuildButton.addEventListener('click', listArchives);
    settingsForm.addEventListener('submit', saveSettings);
    downloadButton.addEventListener('click', downloadModifiedZip);
    downloadArchivesButton.addEventListener('click', downloadSelectedArchives);
    homeButton.addEventListener('click', goToHomePage);
    
    // Initialize the application
    loadZipFiles();
});