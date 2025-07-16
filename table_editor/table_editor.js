// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const increaseFontButton = document.getElementById('increaseFontButton');
    const decreaseFontButton = document.getElementById('decreaseFontButton');
    const saveButton = document.getElementById('saveButton');
    const tableBody = document.getElementById('tableBody');
    const errorMessage = document.getElementById('errorMessage');
    const dataTable = document.getElementById('dataTable');

    // Track last click for double-click detection
    let lastClick = { time: 0, target: null };

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
            const enContent = document.createElement('div');
            enContent.className = 'cell-content';
            const enText = document.createElement('span');
            enText.textContent = item.en; // Newlines preserved
            const enEditIcon = document.createElement('button');
            enEditIcon.className = 'edit-icon';
            const enEditImg = document.createElement('img');
            enEditImg.src = 'pencil.png'; // Ensure pencil.png exists
            enEditImg.alt = 'Edit';
            enEditIcon.appendChild(enEditImg);
            enContent.appendChild(enText);
            enContent.appendChild(enEditIcon);
            enCell.appendChild(enContent);
            enCell.dataset.index = index;
            enCell.dataset.field = 'en';
            row.appendChild(enCell);

            // Russian cell
            const ruCell = document.createElement('td');
            const ruContent = document.createElement('div');
            ruContent.className = 'cell-content';
            const ruText = document.createElement('span');
            ruText.textContent = item.ru; // Newlines preserved
            const ruEditIcon = document.createElement('button');
            ruEditIcon.className = 'edit-icon';
            const ruEditImg = document.createElement('img');
            ruEditImg.src = 'pencil.png';
            ruEditImg.alt = 'Edit';
            ruEditIcon.appendChild(ruEditImg);
            ruContent.appendChild(ruText);
            ruContent.appendChild(ruEditIcon);
            ruCell.appendChild(ruContent);
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
        const contentDiv = cell.querySelector('.cell-content');
        const text = contentDiv.querySelector('span').textContent;
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.className = 'editable-input';

        // Set textarea dimensions to fill cell
        textarea.style.width = '100%';
        textarea.style.minHeight = '100%';
        textarea.style.boxSizing = 'border-box';

        // Replace cell content with textarea
        cell.innerHTML = '';
        cell.appendChild(textarea);

        // Adjust textarea height to fit content
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set to content height

        // Update height on input to accommodate new text
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        });

        // Place cursor at the end of the text
        textarea.focus();
        textarea.setSelectionRange(text.length, text.length);

        // Handle Enter and Shift+Enter
        textarea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent newline if Enter alone
                saveCellEdit(cell, textarea.value);
            }
            // Shift+Enter allows newline
            if (event.key === 'Enter' && event.shiftKey) {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        });
        textarea.addEventListener('blur', () => {
            saveCellEdit(cell, textarea.value);
        });
    }

    // Function to save edited cell content
    function saveCellEdit(cell, value) {
        // Update stored JSON data
        const data = JSON.parse(tableBody.dataset.json);
        const index = parseInt(cell.dataset.index, 10);
        const field = cell.dataset.field;
        data[index][field] = value; // Store multi-line text
        tableBody.dataset.json = JSON.stringify(data);

        // Re-render cell with text and edit icon
        const contentDiv = document.createElement('div');
        contentDiv.className = 'cell-content';
        const textSpan = document.createElement('span');
        textSpan.textContent = value; // Newlines preserved
        const editIcon = document.createElement('button');
        editIcon.className = 'edit-icon';
        const editImg = document.createElement('img');
        editImg.src = 'pencil.png';
        editImg.alt = 'Edit';
        editIcon.appendChild(editImg);
        contentDiv.appendChild(textSpan);
        contentDiv.appendChild(editIcon);
        cell.innerHTML = '';
        cell.appendChild(contentDiv);

        // Update speaker button text if English cell was edited
        const row = cell.parentElement;
        const speakButton = row.querySelector('.speaker-button');
        if (field === 'en' && speakButton) {
            speakButton.dataset.englishText = value;
        }
    }

    // Function to speak text using Web Speech API
    function speakText(text, lang = 'en-US') {
        if (!window.speechSynthesis) {
            setErrorMessage('Speech synthesis is not supported in this browser');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang; // Set language (en-US or ru-RU)
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
            const jsonFile = getUrlParameter('jsondata');
            if (!jsonFile) {
                throw new Error('Parameter "jsondata" is missing in the URL');
            }

            const data = JSON.parse(tableBody.dataset.json);

            // Use jsondata filename
            const filename = jsonFile;

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

    // Function to adjust font size
    function adjustFontSize(multiplier) {
        const currentSize = parseFloat(getComputedStyle(dataTable).getPropertyValue('--cell-font-size'));
        const newSize = currentSize * multiplier;
        dataTable.style.setProperty('--cell-font-size', `${newSize}px`);

        // Re-adjust textarea heights for all editable cells
        document.querySelectorAll('.editable-input').forEach(textarea => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        });
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

    // Event listener for table clicks
    tableBody.addEventListener('click', (event) => {
        const editIcon = event.target.closest('.edit-icon');
        const speakerButton = event.target.closest('.speaker-button');
        const cell = event.target.closest('td');
        const textSpan = event.target.closest('.cell-content span');

        if (speakerButton) {
            // Handle speaker button click
            const englishText = speakerButton.dataset.englishText;
            speakText(englishText, 'en-US');
        } else if (editIcon && cell) {
            // Handle edit icon click
            if (!cell.querySelector('textarea')) {
                makeCellEditable(cell);
            }
        } else if (textSpan && cell && !cell.querySelector('textarea')) {
            // Handle potential double-click on text
            const currentTime = Date.now();
            const isDoubleClick = (
                currentTime - lastClick.time <= 500 &&
                lastClick.target === textSpan &&
                event.button === 0 // Left mouse button
            );

            if (isDoubleClick) {
                const selectedText = window.getSelection().toString().trim();
                if (selectedText) {
                    const lang = cell.dataset.field === 'en' ? 'en-US' : 'ru-RU';
                    speakText(selectedText, lang);
                }
                lastClick = { time: 0, target: null }; // Reset after double-click
            } else {
                lastClick = { time: currentTime, target: textSpan };
            }
        }
    });

    // Event listeners for font size buttons
    increaseFontButton.addEventListener('click', () => adjustFontSize(1.1)); // Increase by 10%
    decreaseFontButton.addEventListener('click', () => adjustFontSize(0.9)); // Decrease by 10%

    // Event listener for Save button
    saveButton.addEventListener('click', saveJsonFile);

    // Load JSON file on page load
    loadJsonFile();
});