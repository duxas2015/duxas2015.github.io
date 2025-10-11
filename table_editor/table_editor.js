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
    const reloadServerButton = document.getElementById('reloadServerButton');
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

    // Function to get current date without time in YYYY-MM-DD format
    function getCurrentDate() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
                // Ensure repeatCheckbox, learnedCheckbox, thirdCheckbox, repeatDate, repeatCount, and index properties exist
                data.forEach((item, idx) => {
                    item.repeatCheckbox = item.repeatCheckbox !== undefined ? item.repeatCheckbox : false;
                    item.learnedCheckbox = item.learnedCheckbox !== undefined ? item.learnedCheckbox : false;
                    item.thirdCheckbox = item.thirdCheckbox !== undefined ? item.thirdCheckbox : false;
                    item.repeatDate = item.repeatDate !== undefined ? item.repeatDate : null;
                    item.repeatCount = item.repeatCount !== undefined ? item.repeatCount : 0;
                    item.index = item.index !== undefined ? item.index : idx; // Assign index
                });
                // Set All button as active with bold red text
                allButton.style.fontWeight = 'bold';
                allButton.style.color = 'red';
                repeatButton.style.fontWeight = 'normal';
                repeatButton.style.color = 'white';
                newButton.style.fontWeight = 'normal';
                newButton.style.color = 'white';
                rerepeatButton.style.fontWeight = 'normal';
                rerepeatButton.style.color = 'white';
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

            // Ensure repeatCheckbox, learnedCheckbox, thirdCheckbox, repeatDate, repeatCount, and index properties exist
            data.forEach((item, idx) => {
                item.repeatCheckbox = item.repeatCheckbox !== undefined ? item.repeatCheckbox : false;
                item.learnedCheckbox = item.learnedCheckbox !== undefined ? item.learnedCheckbox : false;
                item.thirdCheckbox = item.thirdCheckbox !== undefined ? item.thirdCheckbox : false;
                item.repeatDate = item.repeatDate !== undefined ? item.repeatDate : null;
                item.repeatCount = item.repeatCount !== undefined ? item.repeatCount : 0;
                item.index = item.index !== undefined ? item.index : idx; // Assign index
            });

            // Set All button as active with bold red text
            allButton.style.fontWeight = 'bold';
            allButton.style.color = 'red';
            repeatButton.style.fontWeight = 'normal';
            repeatButton.style.color = 'white';
            newButton.style.fontWeight = 'normal';
            newButton.style.color = 'white';
            rerepeatButton.style.fontWeight = 'normal';
            rerepeatButton.style.color = 'white';
            renderTable(data);
        } catch (error) {
            console.error('Error loading JSON file:', error);
            setErrorMessage(`Error loading JSON file: ${error.message}`);
        }
    }

    // Function to reload JSON data from server, ignoring localStorage
    async function reloadFromServer() {
        setErrorMessage('');
        const jsonFile = getUrlParameter('jsondata');

        if (!jsonFile) {
            setErrorMessage('Parameter "jsondata" is missing in the URL');
            return;
        }

        try {
            console.log('Reloading from server:', jsonFile);
            const response = await fetch(jsonFile);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            if (!validateJson(data)) {
                throw new Error('Invalid JSON format: expected array of objects with "en" and "ru" properties');
            }

            // Ensure repeatCheckbox, learnedCheckbox, thirdCheckbox, repeatDate, repeatCount, and index properties exist
            data.forEach((item, idx) => {
                item.repeatCheckbox = item.repeatCheckbox !== undefined ? item.repeatCheckbox : false;
                item.learnedCheckbox = item.learnedCheckbox !== undefined ? item.learnedCheckbox : false;
                item.thirdCheckbox = item.thirdCheckbox !== undefined ? item.thirdCheckbox : false;
                item.repeatDate = item.repeatDate !== undefined ? item.repeatDate : null;
                item.repeatCount = item.repeatCount !== undefined ? item.repeatCount : 0;
                item.index = item.index !== undefined ? item.index : idx; // Assign index
            });

            // Clear localStorage for this file
            localStorage.removeItem(jsonFile);
            console.log('Cleared localStorage for:', jsonFile);

            // Clear pending changes
            pendingChanges = {};

            // Reset filters
            isRepeatFilterActive = false;
            isNewFilterActive = false;
            isReRepeatFilterActive = false;
            repeatButton.style.backgroundColor = '#2196F3';
            newButton.style.backgroundColor = '#2196F3';
            allButton.style.backgroundColor = '#2196F3';
            rerepeatButton.style.backgroundColor = '#2196F3';
            // Set All button as active
            allButton.style.fontWeight = 'bold';
            allButton.style.color = 'red';
            repeatButton.style.fontWeight = 'normal';
            repeatButton.style.color = 'white';
            newButton.style.fontWeight = 'normal';
            newButton.style.color = 'white';
            rerepeatButton.style.fontWeight = 'normal';
            rerepeatButton.style.color = 'white';

            // Render updated table
            tableBody.dataset.json = JSON.stringify(data);
            renderTable(data);
            setErrorMessage('Data reloaded from server successfully');
        } catch (error) {
            console.error('Error reloading from server:', error);
            setErrorMessage(`Error reloading from server: ${error.message}`);
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

                // Ensure repeatCheckbox, learnedCheckbox, thirdCheckbox, repeatDate, repeatCount, and index properties exist
                const currentData = tableBody.dataset.json ? JSON.parse(tableBody.dataset.json) : [];
                const maxIndex = currentData.length > 0 ? Math.max(...currentData.map(item => item.index)) : -1;
                newData.forEach((item, idx) => {
                    item.repeatCheckbox = item.repeatCheckbox !== undefined ? item.repeatCheckbox : false;
                    item.learnedCheckbox = item.learnedCheckbox !== undefined ? item.learnedCheckbox : false;
                    item.thirdCheckbox = item.thirdCheckbox !== undefined ? item.thirdCheckbox : false;
                    item.repeatDate = item.repeatDate !== undefined ? item.repeatDate : null;
                    item.repeatCount = item.repeatCount !== undefined ? item.repeatCount : 0;
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
                allButton.style.backgroundColor = '#2196F3';
                rerepeatButton.style.backgroundColor = '#2196F3';
                // Set All button as active
                allButton.style.fontWeight = 'bold';
                allButton.style.color = 'red';
                repeatButton.style.fontWeight = 'normal';
                repeatButton.style.color = 'white';
                newButton.style.fontWeight = 'normal';
                newButton.style.color = 'white';
                rerepeatButton.style.fontWeight = 'normal';
                rerepeatButton.style.color = 'white';

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
            filteredData = data.filter(item => !item.repeatCheckbox && item.learnedCheckbox);
        } else if (filter === 'new') {
            filteredData = data.filter(item => !item.repeatCheckbox && !item.learnedCheckbox);
        } else if (filter === 'rerepeat') {
            // Sort by repeatDate: null first, then ascending
            filteredData = data.filter(item => item.repeatCheckbox && item.learnedCheckbox).sort((a, b) => {
                if (a.repeatDate === null && b.repeatDate === null) return 0;
                if (a.repeatDate === null) return -1;
                if (b.repeatDate === null) return 1;
                return a.repeatDate.localeCompare(b.repeatDate);
            });
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

            // Speak cell (Speaker, repeatCheckbox, learnedCheckbox, Gear)
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

            // Repeat Checkbox
            const repeatCheckbox = document.createElement('input');
            repeatCheckbox.type = 'checkbox';
            repeatCheckbox.className = 'repeatCheckbox';
            repeatCheckbox.checked = item.repeatCheckbox || false;
            repeatCheckbox.dataset.index = item.index; // Use item.index
            repeatCheckbox.setAttribute('aria-label', 'Repeat Checkbox');
            cellContainer.appendChild(repeatCheckbox);

            // Increment button (only in ReRepeat mode)
            if (isReRepeatFilterActive) {
                const incrementButton = document.createElement('button');
                incrementButton.className = 'increment-button';
                // Add repeat count text
                const countSpan = document.createElement('span');
                countSpan.className = 'increment-count';
                countSpan.textContent = item.repeatCount || 0;
                incrementButton.appendChild(countSpan);
                incrementButton.dataset.index = item.index;
                incrementButton.setAttribute('aria-label', `Increment Repeat Count (Current: ${item.repeatCount || 0})`);
                incrementButton.addEventListener('click', () => {
                    const currentDate = getCurrentDate();
                    if (item.repeatDate === currentDate) {
                        console.log(`No action: repeatDate=${item.repeatDate} matches current date=${currentDate} for index=${item.index}`);
                        return; // No action if repeatDate is today
                    }
                    const newCount = (item.repeatCount || 0) + 1;
                    updateCheckboxState(item.index, newCount, 'repeatCount');
                    updateCheckboxState(item.index, currentDate, 'repeatDate');
                    // Update the displayed count immediately
                    countSpan.textContent = newCount;
                });
                cellContainer.appendChild(incrementButton);
            }

            // Learned Checkbox
            const learnedCheckbox = document.createElement('input');
            learnedCheckbox.type = 'checkbox';
            learnedCheckbox.className = 'learnedCheckbox';
            learnedCheckbox.checked = item.learnedCheckbox || false;
            learnedCheckbox.dataset.index = item.index; // Use item.index
            learnedCheckbox.setAttribute('aria-label', 'Learned Checkbox');
            if (isRepeatFilterActive || isReRepeatFilterActive) {
                learnedCheckbox.disabled = true; // Disable in Repeat and ReRepeat modes
            }
            cellContainer.appendChild(learnedCheckbox);

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
                if (pendingChanges[indexStr].repeatCheckbox !== undefined) {
                    item.repeatCheckbox = pendingChanges[indexStr].repeatCheckbox;
                    console.log(`Applied repeatCheckbox=${item.repeatCheckbox} to row index=${index}`);
                }
                if (pendingChanges[indexStr].learnedCheckbox !== undefined) {
                    item.learnedCheckbox = pendingChanges[indexStr].learnedCheckbox;
                    console.log(`Applied learnedCheckbox=${item.learnedCheckbox} to row index=${index}`);
                }
                if (pendingChanges[indexStr].thirdCheckbox !== undefined) {
                    item.thirdCheckbox = pendingChanges[indexStr].thirdCheckbox;
                    console.log(`Applied thirdCheckbox=${item.thirdCheckbox} to row index=${index}`);
                }
                if (pendingChanges[indexStr].repeatCount !== undefined) {
                    item.repeatCount = pendingChanges[indexStr].repeatCount;
                    console.log(`Applied repeatCount=${item.repeatCount} to row index=${index}`);
                }
                if (pendingChanges[indexStr].repeatDate !== undefined) {
                    item.repeatDate = pendingChanges[indexStr].repeatDate;
                    console.log(`Applied repeatDate=${item.repeatDate} to row index=${index}`);
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
            allButton.style.backgroundColor = '#2196F3';
            rerepeatButton.style.backgroundColor = '#2196F3';
            // Set All button as active
            allButton.style.fontWeight = 'bold';
            allButton.style.color = 'red';
            repeatButton.style.fontWeight = 'normal';
            repeatButton.style.color = 'white';
            newButton.style.fontWeight = 'normal';
            newButton.style.color = 'white';
            rerepeatButton.style.fontWeight = 'normal';
            rerepeatButton.style.color = 'white';

            // Update stored data and re-render table without filter
            tableBody.dataset.json = JSON.stringify(updatedData);
            renderTable(updatedData);
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
                // Update stored data
                tableBody.dataset.json = jsonString;
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
        minusIcon.src = 'minus.png'; // Fixed: Correct path to minus.png
        minusIcon.alt = 'Delete Row';
        minusButton.appendChild(minusIcon);
        minusButton.setAttribute('aria-label', 'Delete this row');
        minusButton.addEventListener('click', () => {
            deleteRow(index);
            menu.remove();
            openContextMenu = null;
        });
        menu.appendChild(minusButton);

        // Third Checkbox
        const thirdCheckboxContainer = document.createElement('div');
        thirdCheckboxContainer.style.display = 'flex';
        thirdCheckboxContainer.style.alignItems = 'center';
        const thirdCheckboxLabel = document.createElement('label');
        thirdCheckboxLabel.textContent = 'Mark 3';
        thirdCheckboxLabel.style.marginRight = '8px';
        const thirdCheckbox = document.createElement('input');
        thirdCheckbox.type = 'checkbox';
        thirdCheckbox.className = 'thirdCheckbox';
        const data = JSON.parse(tableBody.dataset.json);
        const item = data.find(item => item.index === index);
        thirdCheckbox.checked = item ? item.thirdCheckbox || false : false;
        thirdCheckbox.dataset.index = index;
        thirdCheckbox.setAttribute('aria-label', 'Mark row 3');
        thirdCheckbox.addEventListener('change', () => {
            updateCheckboxState(index, thirdCheckbox.checked, 'thirdCheckbox');
        });
        thirdCheckboxContainer.appendChild(thirdCheckboxLabel);
        thirdCheckboxContainer.appendChild(thirdCheckbox);
        menu.appendChild(thirdCheckboxContainer);

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
        data.splice(pos, 0, { 
            en: '', 
            ru: '', 
            repeatCheckbox: false, 
            learnedCheckbox: false, 
            thirdCheckbox: false, 
            repeatDate: null, 
            repeatCount: 0, 
            index: maxIndex 
        });
        tableBody.dataset.json = JSON.stringify(data);
        // Clear pending changes for consistency
        pendingChanges = {};
        // Reset filters
        isRepeatFilterActive = false;
        isNewFilterActive = false;
        isReRepeatFilterActive = false;
        repeatButton.style.backgroundColor = '#2196F3';
        newButton.style.backgroundColor = '#2196F3';
        allButton.style.backgroundColor = '#2196F3';
        rerepeatButton.style.backgroundColor = '#2196F3';
        // Set All button as active
        allButton.style.fontWeight = 'bold';
        allButton.style.color = 'red';
        repeatButton.style.fontWeight = 'normal';
        repeatButton.style.color = 'white';
        newButton.style.fontWeight = 'normal';
        newButton.style.color = 'white';
        rerepeatButton.style.fontWeight = 'normal';
        rerepeatButton.style.color = 'white';
        renderTable(data);
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
        allButton.style.backgroundColor = '#2196F3';
        rerepeatButton.style.backgroundColor = '#2196F3';
        // Set All button as active
        allButton.style.fontWeight = 'bold';
        allButton.style.color = 'red';
        repeatButton.style.fontWeight = 'normal';
        repeatButton.style.color = 'white';
        newButton.style.fontWeight = 'normal';
        newButton.style.color = 'white';
        rerepeatButton.style.fontWeight = 'normal';
        rerepeatButton.style.color = 'white';
        renderTable(data);
    }

    // Function to update checkbox state or repeat-related fields
    function updateCheckboxState(index, value, field) {
        if (!pendingChanges[index]) {
            pendingChanges[index] = {};
        }
        pendingChanges[index][field] = value;
        console.log(`Pending change: row index=${index}, ${field}=${value}`);
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

    // Function to filter rows for Repeat (repeatCheckbox: false, learnedCheckbox: true)
    function filterRepeatRows() {
        saveToLocalStorage().then(() => {
            isRepeatFilterActive = true;
            isNewFilterActive = false;
            isReRepeatFilterActive = false;
            const data = JSON.parse(tableBody.dataset.json);
            renderTable(data, 'repeat');
            repeatButton.style.fontWeight = 'bold';
            repeatButton.style.color = 'red';
            newButton.style.fontWeight = 'normal';
            newButton.style.color = 'white';
            allButton.style.fontWeight = 'normal';
            allButton.style.color = 'white';
            rerepeatButton.style.fontWeight = 'normal';
            rerepeatButton.style.color = 'white';
        });
    }

    // Function to filter rows for New (repeatCheckbox: false, learnedCheckbox: false)
    function filterNewRows() {
        saveToLocalStorage().then(() => {
            isNewFilterActive = true;
            isRepeatFilterActive = false;
            isReRepeatFilterActive = false;
            const data = JSON.parse(tableBody.dataset.json);
            renderTable(data, 'new');
            newButton.style.fontWeight = 'bold';
            newButton.style.color = 'red';
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

    // Function to filter rows for ReRepeat (repeatCheckbox: true, learnedCheckbox: true)
    function filterReRepeatRows() {
        saveToLocalStorage().then(() => {
            isReRepeatFilterActive = true;
            isRepeatFilterActive = false;
            isNewFilterActive = false;
            const data = JSON.parse(tableBody.dataset.json);
            renderTable(data, 'rerepeat');
            rerepeatButton.style.fontWeight = 'bold';
            rerepeatButton.style.color = 'red';
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
        const repeatCheckbox = event.target.closest('.repeatCheckbox');
        const learnedCheckbox = event.target.closest('.learnedCheckbox');
        const incrementButton = event.target.closest('.increment-button');
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
        } else if (repeatCheckbox) {
            // Handle repeatCheckbox change
            const index = parseInt(repeatCheckbox.dataset.index, 10);
            updateCheckboxState(index, repeatCheckbox.checked, 'repeatCheckbox');
        } else if (learnedCheckbox && !learnedCheckbox.disabled) {
            // Handle learnedCheckbox change (only if not disabled)
            const index = parseInt(learnedCheckbox.dataset.index, 10);
            updateCheckboxState(index, learnedCheckbox.checked, 'learnedCheckbox');
        } else if (incrementButton) {
            // Handle increment button click (handled in renderTable)
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

    // Event listener for Reload from Server button
    reloadServerButton.addEventListener('click', reloadFromServer);

    // Load JSON data on page load
    loadJsonData();
});