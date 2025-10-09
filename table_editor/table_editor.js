// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const increaseFontButton = document.getElementById('increaseFontButton');
    const decreaseFontButton = document.getElementById('decreaseFontButton');
    const saveButton = document.getElementById('saveButton');
    const saveLocalButton = document.getElementById('saveLocalButton');
    const repeatButton = document.getElementById('repeatButton');
    const newButton = document.getElementById('newButton');
    const allButton = document.getElementById('allButton');
    const rerepeatButton = document.getElementById('rerepeatButton');
    const tableBody = document.getElementById('tableBody');
    const errorMessage = document.getElementById('errorMessage');
    const dataTable = document.getElementById('dataTable');

    // Track last click for double-click detection
    let lastClick = { time: 0, target: null };
    // Track open context menu
    let openContextMenu = null;
    // Track filter state
    let isRepeatFilterActive = false;
    let isNewFilterActive = false;
    let isReRepeatFilterActive = false;
    // Track pending checkbox changes
    let pendingChanges = {};

    // Function to set error messages
    function setErrorMessage(message) {
        errorMessage.textContent = message;
        console.log('Error/UI message:', message); // Log for debugging
    }

    // Function to get URL parameter by name
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Function to validate JSON data
    function validateJson(data) {
        return Array.isArray(data) && data.every(item => 'en' in item && 'ru' in item);
    }

    // Function to estimate storage quota (modern browsers)
    async function checkStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const quota = estimate.quota || 0;
            const usage = estimate.usage || 0;
            console.log(`Storage quota: ${quota} bytes, usage: ${usage} bytes, available: ${quota - usage} bytes`);
            return { quota, usage, available: quota - usage };
        } else {
            console.log('Storage estimate not supported');
            return null;
        }
    }

    // Function to load JSON data (localStorage first, then file)
    async function loadJsonData() {
        setErrorMessage('');
        const jsonFile = getUrlParameter('jsondata');

        if (!jsonFile) {
            setErrorMessage('Parameter "jsondata" is missing in the URL');
            return;
        }

        // Try localStorage first
        let data = null;
        try {
            console.log('Attempting to load from localStorage:', jsonFile);
            const storedData = localStorage.getItem(jsonFile);
            if (storedData) {
                console.log('Loaded from localStorage, length:', storedData.length);
                data = JSON.parse(storedData);
                if (!validateJson(data)) {
                    throw new Error('Invalid JSON format in localStorage: expected array of objects with "en" and "ru" properties');
                }
                // Ensure chk, chk2, and index properties exist
                data.forEach((item, idx) => {
                    item.chk = item.chk !== undefined ? item.chk : false;
                    item.chk2 = item.chk2 !== undefined ? item.chk2 : false;
                    item.index = item.index !== undefined ? item.index : idx; // Assign index
                });
                renderTable(data);
                setErrorMessage('Loaded data from localStorage');
                return;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            setErrorMessage(`Error loading from localStorage: ${error.message}, falling back to file`);
        }

        // Fall back to file
        try {
            console.log('Falling back to fetch:', jsonFile);
            const response = await fetch(jsonFile);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }
            data = await response.json();

            if (!validateJson(data)) {
                throw new Error('Invalid JSON format: expected array of objects with "en" and "ru" properties');
            }

            // Ensure chk, chk2, and index properties exist
            data.forEach((item, idx) => {
                item.chk = item.chk !== undefined ? item.chk : false;
                item.chk2 = item.chk2 !== undefined ? item.chk2 : false;
                item.index = item.index !== undefined ? item.index : idx; // Assign index
            });

            renderTable(data);
        } catch (error) {
            console.error('Error loading JSON file:', error);
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

                if (!validateJson(newData)) {
                    throw new Error('Invalid JSON format: expected array of objects with "en" and "ru" properties');
                }

                // Ensure chk, chk2, and index properties exist
                const currentData = tableBody.dataset.json ? JSON.parse(tableBody.dataset.json) : [];
                const maxIndex = currentData.length > 0 ? Math.max(...currentData.map(item => item.index)) : -1;
                newData.forEach((item, idx) => {
                    item.chk = item.chk !== undefined ? item.chk : false;
                    item.chk2 = item.chk2 !== undefined ? item.chk2 : false;
                    item.index = item.index !== undefined ? item.index : maxIndex + idx + 1; // Assign unique index
                });

                // Append new data
                const updatedData = [...currentData, ...newData];

                // Clear pending changes
                pendingChanges = {};

                // Reset filters
                isRepeatFilterActive = false;
                isNewFilterActive = false;
                isReRepeatFilterActive = false;
                repeatButton.style.backgroundColor = '#2196F3';
                newButton.style.backgroundColor = '#2196F3';
                allButton.style.backgroundColor = '#1976D2';
                rerepeatButton.style.backgroundColor = '#2196F3';

                // Render updated table
                renderTable(updatedData);
                setErrorMessage('JSON file uploaded and appended successfully');
            } catch (error) {
                console.error('Error processing uploaded file:', error);
                setErrorMessage(`Error processing uploaded file: ${error.message}`);
            }
        };
        reader.onerror = () => {
            setErrorMessage('Error reading uploaded file');
        };
        reader.readAsText(file);
    }

    // Function to render table from JSON data
    function renderTable(data, filter = null) {
        tableBody.innerHTML = ''; // Clear existing rows

        let filteredData = data;
        if (filter === 'repeat') {
            filteredData = data.filter(item => !item.chk && item.chk2);
        } else if (filter === 'new') {
            filteredData = data.filter(item => !item.chk && !item.chk2);
        } else if (filter === 'rerepeat') {
            filteredData = data.filter(item => item.chk && item.chk2);
        }

        console.log(`Rendering table: total rows=${data.length}, filtered=${filteredData.length}, filter=${filter}`);

        filteredData.forEach((item) => {
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
            enCell.dataset.index = item.index; // Use item.index
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
            ruCell.dataset.index = item.index; // Use item.index
            ruCell.dataset.field = 'ru';
            row.appendChild(ruCell);

            // Speak cell (Speaker, Checkbox, Checkbox2, Gear)
            const speakCell = document.createElement('td');
            const cellContainer = document.createElement('div');
            cellContainer.style.display = 'flex';
            cellContainer.style.alignItems = 'center';

            // Speaker button
            const speakButton = document.createElement('button');
            speakButton.className = 'speaker-button';
            const speakIcon = document.createElement('img');
            speakIcon.src = 'speaker.png'; // Ensure speaker.png exists
            speakIcon.alt = 'Speak';
            speakButton.appendChild(speakIcon);
            speakButton.dataset.englishText = item.en;
            cellContainer.appendChild(speakButton);

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox';
            checkbox.checked = item.chk || false;
            checkbox.dataset.index = item.index; // Use item.index
            checkbox.setAttribute('aria-label', 'Mark row');
            cellContainer.appendChild(checkbox);

            // Checkbox2
            const checkbox2 = document.createElement('input');
            checkbox2.type = 'checkbox';
            checkbox2.className = 'checkbox2';
            checkbox2.checked = item.chk2 || false;
            checkbox2.dataset.index = item.index; // Use item.index
            checkbox2.setAttribute('aria-label', 'Mark row 2');
            cellContainer.appendChild(checkbox2);

            // Gear button
            const gearButton = document.createElement('button');
            gearButton.className = 'gear-button';
            const gearIcon = document.createElement('img');
            gearIcon.src = 'gear.png'; // Ensure gear.png exists
            gearIcon.alt = 'Settings';
            gearButton.appendChild(gearIcon);
            gearButton.dataset.index = item.index; // Use item.index
            gearButton.setAttribute('aria-label', 'Row settings');
            cellContainer.appendChild(gearButton);

            speakCell.appendChild(cellContainer);
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
        textarea.setAttribute('aria-label', `Edit ${cell.dataset.field} text`);

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
        const item = data.find(item => item.index === index);
        if (item) {
            item[field] = value; // Store multi-line text
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

            // Re-render table with current filter
            renderTable(data, isRepeatFilterActive ? 'repeat' : isNewFilterActive ? 'new' : isReRepeatFilterActive ? 'rerepeat' : null);
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

    // Function to apply pending checkbox changes
    function applyPendingChanges(data) {
        console.log('Applying pending changes:', JSON.stringify(pendingChanges));
        Object.keys(pendingChanges).forEach(indexStr => {
            const index = parseInt(indexStr, 10);
            const item = data.find(item => item.index === index);
            if (item) {
                if (pendingChanges[indexStr].chk !== undefined) {
                    item.chk = pendingChanges[indexStr].chk;
                    console.log(`Applied chk=${item.chk} to row index=${index}`);
                }
                if (pendingChanges[indexStr].chk2 !== undefined) {
                    item.chk2 = pendingChanges[indexStr].chk2;
                    console.log(`Applied chk2=${item.chk2} to row index=${index}`);
                }
            }
        });
        console.log('Data after applying changes (first 3 rows):', JSON.stringify(data.slice(0, 3)));
        return data;
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
            // Apply pending checkbox changes
            const updatedData = applyPendingChanges(data);

            // Create Blob and trigger download
            const blob = new Blob([JSON.stringify(updatedData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = jsonFile;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Reset filters to show all rows
            isRepeatFilterActive = false;
            isNewFilterActive = false;
            isReRepeatFilterActive = false;
            repeatButton.style.backgroundColor = '#2196F3';
            newButton.style.backgroundColor = '#2196F3';
            allButton.style.backgroundColor = '#1976D2';
            rerepeatButton.style.backgroundColor = '#2196F3';

            // Update stored data and re-render table without filter
            tableBody.dataset.json = JSON.stringify(updatedData);
            renderTable(updatedData, null);
            pendingChanges = {}; // Clear pending changes after successful save

            setErrorMessage('JSON file saved successfully');
        } catch (error) {
            console.error('Error saving JSON file:', error);
            setErrorMessage(`Error saving JSON file: ${error.message}`);
        }
    }

    // Function to save table data to localStorage
    async function saveToLocalStorage() {
        setErrorMessage('');
        const jsonFile = getUrlParameter('jsondata');
        if (!jsonFile) {
            setErrorMessage('Parameter "jsondata" is missing in the URL');
            return;
        }

        try {
            // Check quota first
            const quotaInfo = await checkStorageQuota();
            if (quotaInfo && quotaInfo.available < 1024 * 1024) { // Less than 1MB available
                console.warn('Low storage available, may fail');
                setErrorMessage('Warning: Low storage available, saving may fail');
            }

            const data = JSON.parse(tableBody.dataset.json);
            console.log('Data before apply, length:', JSON.stringify(data).length);
            // Apply pending checkbox changes
            const updatedData = applyPendingChanges(data);
            const jsonString = JSON.stringify(updatedData);
            console.log('Data after apply, length:', jsonString.length);

            // Test setItem with try-catch for quota
            localStorage.setItem(jsonFile, jsonString);
            console.log('localStorage setItem successful for:', jsonFile);

            // Verify save
            const verify = localStorage.getItem(jsonFile);
            if (verify === jsonString) {
                console.log('Verification: localStorage saved correctly');
                // Reset filters to show all rows
                isRepeatFilterActive = false;
                isNewFilterActive = false;
                isReRepeatFilterActive = false;
                repeatButton.style.backgroundColor = '#2196F3';
                newButton.style.backgroundColor = '#2196F3';
                allButton.style.backgroundColor = '#1976D2';
                rerepeatButton.style.backgroundColor = '#2196F3';
                // Update stored data and re-render table without filter
                tableBody.dataset.json = jsonString;
                renderTable(updatedData, null);
                pendingChanges = {}; // Clear pending changes after successful save
                setErrorMessage('JSON data saved to localStorage successfully. On Android, close Chrome fully to ensure changes persist.');
            } else {
                throw new Error('Verification failed: saved data mismatch');
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            setErrorMessage(`Error saving to localStorage: ${error.message}. On Android, close Chrome fully and retry.`);
        }
    }

    // Function to create context menu
    function createContextMenu(index, gearButton) {
        // Close existing menu
        if (openContextMenu) {
            openContextMenu.remove();
            openContextMenu = null;
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';

        // Position menu below gear button
        const rect = gearButton.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;

        // Plus button
        const plusButton = document.createElement('button');
        const plusIcon = document.createElement('img');
        plusIcon.src = 'plus.png'; // Ensure plus.png exists
        plusIcon.alt = 'Add Row';
        plusButton.appendChild(plusIcon);
        plusButton.setAttribute('aria-label', 'Add new row below');
        plusButton.addEventListener('click', () => {
            addRow(index);
            menu.remove();
            openContextMenu = null;
        });
        menu.appendChild(plusButton);

        // Minus button
        const minusButton = document.createElement('button');
        const minusIcon = document.createElement('img');
        minusIcon.src = 'minus.png'; // Ensure minus.png exists
        minusIcon.alt = 'Delete Row';
        minusButton.appendChild(minusIcon);
        minusButton.setAttribute('aria-label', 'Delete this row');
        minusButton.addEventListener('click', () => {
            deleteRow(index);
            menu.remove();
            openContextMenu = null;
        });
        menu.appendChild(minusButton);

        document.body.appendChild(menu);
        openContextMenu = menu;
    }

    // Function to add new row
    function addRow(index) {
        const data = JSON.parse(tableBody.dataset.json);
        // Find the position after the item with the given index
        const pos = data.findIndex(item => item.index === index) + 1;
        // Find max index to assign a new unique index
        const maxIndex = Math.max(...data.map(item => item.index), -1) + 1;
        data.splice(pos, 0, { en: '', ru: '', chk: false, chk2: false, index: maxIndex });
        tableBody.dataset.json = JSON.stringify(data);
        // Clear pending changes for consistency
        pendingChanges = {};
        // Reset filters
        isRepeatFilterActive = false;
        isNewFilterActive = false;
        isReRepeatFilterActive = false;
        repeatButton.style.backgroundColor = '#2196F3';
        newButton.style.backgroundColor = '#2196F3';
        allButton.style.backgroundColor = '#1976D2';
        rerepeatButton.style.backgroundColor = '#2196F3';
        renderTable(data, null);
    }

    // Function to delete row
    function deleteRow(index) {
        const data = JSON.parse(tableBody.dataset.json);
        if (data.length <= 1) {
            setErrorMessage('Cannot delete the last row');
            return;
        }
        // Remove item with matching index
        const pos = data.findIndex(item => item.index === index);
        if (pos !== -1) {
            data.splice(pos, 1);
        }
        // Clear pending changes for deleted row
        delete pendingChanges[index];
        tableBody.dataset.json = JSON.stringify(data);
        // Reset filters
        isRepeatFilterActive = false;
        isNewFilterActive = false;
        isReRepeatFilterActive = false;
        repeatButton.style.backgroundColor = '#2196F3';
        newButton.style.backgroundColor = '#2196F3';
        allButton.style.backgroundColor = '#1976D2';
        rerepeatButton.style.backgroundColor = '#2196F3';
        renderTable(data, null);
    }

    // Function to update checkbox state
    function updateCheckboxState(index, checked, field) {
        if (!pendingChanges[index]) {
            pendingChanges[index] = {};
        }
        pendingChanges[index][field] = checked;
        console.log(`Pending change: row index=${index}, ${field}=${checked}`);
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

    // Function to filter rows for Repeat (chk: false, chk2: true)
    function filterRepeatRows() {
        saveToLocalStorage().then(() => {
            isRepeatFilterActive = !isRepeatFilterActive;
            isNewFilterActive = false; // Disable other filter
            isReRepeatFilterActive = false;
            const data = JSON.parse(tableBody.dataset.json);
            renderTable(data, isRepeatFilterActive ? 'repeat' : null);
            repeatButton.style.fontWeight = isRepeatFilterActive ? 'bold' : 'normal';
            repeatButton.style.color = isRepeatFilterActive ? 'red' : 'white';
            newButton.style.fontWeight = 'normal';
            newButton.style.color = 'white';
            allButton.style.fontWeight = 'normal';
            allButton.style.color = 'white';
            rerepeatButton.style.fontWeight = 'normal';
            rerepeatButton.style.color = 'white';
        });
    }

    // Function to filter rows for New (chk: false, chk2: false)
    function filterNewRows() {
        saveToLocalStorage().then(() => {
            isNewFilterActive = !isNewFilterActive;
            isRepeatFilterActive = false; // Disable other filter
            isReRepeatFilterActive = false;
            const data = JSON.parse(tableBody.dataset.json);
            renderTable(data, isNewFilterActive ? 'new' : null);
            newButton.style.fontWeight = isNewFilterActive ? 'bold' : 'normal';
            newButton.style.color = isNewFilterActive ? 'red' : 'white';
            repeatButton.style.fontWeight = 'normal';
            repeatButton.style.color = 'white';
            allButton.style.fontWeight = 'normal';
            allButton.style.color = 'white';
            rerepeatButton.style.fontWeight = 'normal';
            rerepeatButton.style.color = 'white';
        });
    }

    // Function to show all rows
    function showAllRows() {
        saveToLocalStorage().then(() => {
            isRepeatFilterActive = false;
            isNewFilterActive = false;
            isReRepeatFilterActive = false;
            const data = JSON.parse(tableBody.dataset.json);
            renderTable(data);
            allButton.style.fontWeight = 'bold';
            allButton.style.color = 'red';
            repeatButton.style.fontWeight = 'normal';
            repeatButton.style.color = 'white';
            newButton.style.fontWeight = 'normal';
            newButton.style.color = 'white';
            rerepeatButton.style.fontWeight = 'normal';
            rerepeatButton.style.color = 'white';
        });
    }

    // Function to filter rows for ReRepeat (chk: true, chk2: true)
    function filterReRepeatRows() {
        saveToLocalStorage().then(() => {
            isReRepeatFilterActive = !isReRepeatFilterActive;
            isRepeatFilterActive = false;
            isNewFilterActive = false;
            const data = JSON.parse(tableBody.dataset.json);
            renderTable(data, isReRepeatFilterActive ? 'rerepeat' : null);
            rerepeatButton.style.fontWeight = isReRepeatFilterActive ? 'bold' : 'normal';
            rerepeatButton.style.color = isReRepeatFilterActive ? 'red' : 'white';
            repeatButton.style.fontWeight = 'normal';
            repeatButton.style.color = 'white';
            newButton.style.fontWeight = 'normal';
            newButton.style.color = 'white';
            allButton.style.fontWeight = 'normal';
            allButton.style.color = 'white';
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
        const gearButton = event.target.closest('.gear-button');
        const checkbox = event.target.closest('.checkbox');
        const checkbox2 = event.target.closest('.checkbox2');
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
        } else if (gearButton) {
            // Handle gear button click
            const index = parseInt(gearButton.dataset.index, 10);
            createContextMenu(index, gearButton);
        } else if (checkbox) {
            // Handle checkbox change
            const index = parseInt(checkbox.dataset.index, 10);
            updateCheckboxState(index, checkbox.checked, 'chk');
        } else if (checkbox2) {
            // Handle checkbox2 change
            const index = parseInt(checkbox2.dataset.index, 10);
            updateCheckboxState(index, checkbox2.checked, 'chk2');
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

    // Close context menu on outside click
    document.addEventListener('click', (event) => {
        if (openContextMenu && !event.target.closest('.gear-button') && !event.target.closest('.context-menu')) {
            openContextMenu.remove();
            openContextMenu = null;
        }
    });

    // Event listeners for font size buttons
    increaseFontButton.addEventListener('click', () => adjustFontSize(1.1)); // Increase by 10%
    decreaseFontButton.addEventListener('click', () => adjustFontSize(0.9)); // Decrease by 10%

    // Event listener for Save button
    saveButton.addEventListener('click', saveJsonFile);

    // Event listener for Save Local button
    saveLocalButton.addEventListener('click', saveToLocalStorage);

    // Event listeners for filter buttons
    repeatButton.addEventListener('click', filterRepeatRows);
    newButton.addEventListener('click', filterNewRows);
    allButton.addEventListener('click', showAllRows);
    rerepeatButton.addEventListener('click', filterReRepeatRows);

    // Load JSON data on page load
    loadJsonData();
});