// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
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

    // Function to load JSON file
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
    }

    // Function to save table data as JSON file
    function saveJsonFile() {
        setErrorMessage('');
        try {
            const data = JSON.parse(tableBody.dataset.json);

            // Generate filename with current date and time
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-'); // e.g., 2025-05-23T11-21-00-000Z
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

    // Event listener for cell clicks to enable editing
    tableBody.addEventListener('click', (event) => {
        const cell = event.target.closest('td');
        if (cell && !cell.querySelector('input')) {
            makeCellEditable(cell);
        }
    });

    // Event listener for Save button
    saveButton.addEventListener('click', saveJsonFile);

    // Load JSON file on page load
    loadJsonFile();
});