// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const saveButton = document.getElementById('saveButton');
    const tableBody = document.getElementById('tableBody');
    const errorMessage = document.getElementById('errorMessage');

    // Function to set error messages
    function setErrorMessage(message) {
        errorMessage.textContent = message;
    }

    // Function to get URL parameter by name
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Function to load JSON file from URL parameter
    async function loadJsonFile() {
        setErrorMessage('');
        const jsonFile = getUrlParameter('jsondata');

        if (!jsonFile) {
            setErrorMessage('Parameter "jsondata" is missing in the URL');
            return;
        }

        try {
            const response = await fetch(jsonFile);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            // Validate JSON format
            if (!Array.isArray(data) || !data.every(item => 'en' in item && 'ru' in item)) {
                throw new Error('Invalid JSON format: expected array of objects with "en" and "ru" properties');
            }

            // Render table
            renderTable(data);
        } catch (error) {
            setErrorMessage(`Error loading JSON file: ${error.message}`);
        }
    }

    // Function to handle file upload
    function handleFileUpload(file) {
        setErrorMessage('');
        if (!file || !file.name.endsWith('.json')) {
            setErrorMessage('Please upload a valid JSON file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const newData = JSON.parse(event.target.result);

                // Validate JSON format
                if (!Array.isArray(newData) || !newData.every(item => 'en' in item && 'ru' in item)) {
                    throw new Error('Invalid JSON format: expected array of objects with "en" and "ru" properties');
                }

                // Get current table data
                const currentData = tableBody.dataset.json ? JSON.parse(tableBody.dataset.json) : [];

                // Append new data
                const updatedData = [...currentData, ...newData];

                // Render updated table
                renderTable(updatedData);
                setErrorMessage('JSON file uploaded and appended successfully');
            } catch (error) {
                setErrorMessage(`Error processing uploaded file: ${error.message}`);
            }
        };
        reader.onerror = () => {
            setErrorMessage('Error reading uploaded file');
        };
        reader.readAsText(file);
    }

    // Function to render table from JSON data
    function renderTable(data) {
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach((item, index) => {
            const row = document.createElement('tr');

            // English cell
            const enCell = document.createElement('td');
            enCell.textContent = item.en;
            enCell.dataset.index = index;
            enCell.dataset.field = 'en';
            row.appendChild(enCell);

            // Russian cell
            const ruCell = document.createElement('td');
            ruCell.textContent = item.ru;
            ruCell.dataset.index = index;
            ruCell.dataset.field = 'ru';
            row.appendChild(ruCell);

            // Speaker button cell
            const speakCell = document.createElement('td');
            const speakButton = document.createElement('button');
            speakButton.className = 'speaker-button';
            const speakIcon = document.createElement('img');
            speakIcon.src = 'speaker.png'; // Ensure speaker.png exists
            speakIcon.alt = 'Speak';
            speakButton.appendChild(speakIcon);
            speakButton.dataset.englishText = item.en; // Store English text for speech
            speakCell.appendChild(speakButton);
            row.appendChild(speakCell);

            tableBody.appendChild(row);
        });

        // Store data for later use
        tableBody.dataset.json = JSON.stringify(data);
    }

    // Function to make cell editable
    function makeCellEditable(cell) {
        const text = cell.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = text;
        input.className = 'editable-input';

        // Replace cell content with input
        cell.textContent = '';
        cell.appendChild(input);
        input.focus();

        // Save on Enter or blur
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                saveCellEdit(cell, input.value);
            }
        });
        input.addEventListener('blur', () => {
            saveCellEdit(cell, input.value);
        });
    }

    // Function to save edited cell content
    function saveCellEdit(cell, value) {
        // Update cell content
        cell.textContent = value;

        // Update stored JSON data
        const data = JSON.parse(tableBody.dataset.json);
        const index = parseInt(cell.dataset.index, 10);
        const field = cell.dataset.field;
        data[index][field] = value;
        tableBody.dataset.json = JSON.stringify(data);

        // Update speaker button text if English cell was edited
        const row = cell.parentElement;
        const speakButton = row.querySelector('.speaker-button');
        if (field === 'en' && speakButton) {
            speakButton.dataset.englishText = value;
        }
    }

    // Function to speak text using Web Speech API
    function speakText(text) {
        if (!window.speechSynthesis) {
            setErrorMessage('Speech synthesis is not supported in this browser');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Set language to English
        utterance.rate = 1; // Normal speed
        utterance.pitch = 1; // Normal pitch

        // Speak the text
        window.speechSynthesis.speak(utterance);

        // Handle errors
        utterance.onerror = (event) => {
            setErrorMessage(`Speech error: ${event.error}`);
        };
    }

    // Function to save table data as JSON file
    function saveJsonFile() {
        setErrorMessage('');
        try {
            const data = JSON.parse(tableBody.dataset.json);

            // Generate filename with current date and time
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-'); // e.g., 2025-05-29T13-51-00-000Z
            const filename = `translations_${timestamp}.json`;

            // Create Blob and trigger download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setErrorMessage('JSON file saved successfully');
        } catch (error) {
            setErrorMessage(`Error saving JSON file: ${error.message}`);
        }
    }

    // Event listener for file input
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            handleFileUpload(file);
            // Reset input to allow re-uploading the same file
            event.target.value = '';
        }
    });

    // Event listener for cell clicks to enable editing or speak
    tableBody.addEventListener('click', (event) => {
        const cell = event.target.closest('td');
        const button = event.target.closest('.speaker-button');

        if (button) {
            // Handle speaker button click
            const englishText = button.dataset.englishText;
            speakText(englishText);
        } else if (cell && !cell.querySelector('input') && !cell.querySelector('.speaker-button')) {
            // Handle editable cell click
            makeCellEditable(cell);
        }
    });

    // Event listener for Save button
    saveButton.addEventListener('click', saveJsonFile);

    // Load JSON file on page load
    loadJsonFile();
});