document.addEventListener('DOMContentLoaded', () => {
    const downloadCertsButton = document.getElementById('downloadCertsButton');
    const generateCertsButton = document.getElementById('generateCertsButton');
    const processingOverlay = document.getElementById('processingOverlay');
    const processingMessage = document.getElementById('processingMessage');
    const generateResult = document.getElementById('generateResult');
    const homeButton = document.getElementById('homeButton');

    // Navigate home
    homeButton.addEventListener('click', () => {
        window.location.href = '/';
    });

    // Download squidCerts.zip
    downloadCertsButton.addEventListener('click', () => {
        window.location.href = '/api/freeradius/download';
    });

    // Generate new certs
    generateCertsButton.addEventListener('click', async () => {
        // Show processing overlay
        processingMessage.textContent = 'Generating certificates... Please wait.';
        processingOverlay.classList.add('active');
        generateResult.classList.add('hidden');
        generateResult.innerHTML = '';

        try {
            const response = await fetch('/api/freeradius/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                generateResult.innerHTML = '<p style="color: #2e7d32; background: #e8f5e9; padding: 10px; border-radius: 4px;">Certificates generated and FreeRADIUS restarted successfully. Downloading archive...</p>';
                // Auto-download the new squidCerts.zip
                window.location.href = '/api/freeradius/download';
            } else {
                const errMsg = data.error || 'Unknown error occurred';
                generateResult.innerHTML = `<p class="error-message">${errMsg}</p>`;
            }
        } catch (error) {
            generateResult.innerHTML = `<p class="error-message">Network error: ${error.message}</p>`;
        } finally {
            processingOverlay.classList.remove('active');
            generateResult.classList.remove('hidden');
        }
    });
});
