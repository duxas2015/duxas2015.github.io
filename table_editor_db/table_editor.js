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
    const downloadLocalButton = document.getElementById('downloadLocalButton');
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

    // Function to download JSON from localStorage
    function downloadLocalJson() {
        setErrorMessage('');
        const jsonFile = getUrlParameter('jsondata');
        if (!jsonFile) {
            setErrorMessage('Parameter "jsondata" is missing in the URL');
            return;
        }

        try {
            const storedData = localStorage.getItem(jsonFile);
            if (!storedData) {
                setErrorMessage('No data found in localStorage to download');
                return;
            }

            let data;
            try {
                data = JSON.parse(storedData);
                if (!validateJson(data)) {
                    throw new Error('Invalid JSON format in localStorage: expected array of objects with "en" and "ru" properties');
                }
            } catch (error) {
                console.error('Error parsing localStorage data:', error);
                setErrorMessage(`Error parsing localStorage data: ${error.message}`);
                return;
            }

            // Create a Blob with the JSON data
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = jsonFile || 'data.json'; // Use URL parameter as filename or fallback
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setErrorMessage('JSON data downloaded successfully');
        } catch (error) {
            console.error('Error downloading JSON:', error);
            setErrorMessage(`Error downloading JSON: ${error.message}`);
        }
    }

    // Function to load JSON data (localStorage first, then DB, then file)
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
                // Ensure properties exist
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
            setErrorMessage(`Error loading from localStorage: ${error.message}, falling back to server`);
        }

        // Try loading from DB
        try {
            console.log('Attempting to load from DB via load.php:', jsonFile);
            const file_key = jsonFile.replace('.json', '');
            const dbResponse = await fetch(`load.php?file_key=${encodeURIComponent(file_key)}`);
            if (dbResponse.ok) {
                const text = await dbResponse.text();
                console.log('Raw DB response:', text.substring(0, 200)); // Log raw response
                try {
                    data = JSON.parse(text);
                    if (validateJson(data)) {
                        // Ensure properties exist
                        data.forEach((item, idx) => {
                            item.repeatCheckbox = item.repeatCheckbox !== undefined ? item.repeatCheckbox : false;
                            item.learnedCheckbox = item.learnedCheckbox !== undefined ? item.learnedCheckbox : false;
                            item.thirdCheckbox = item.thirdCheckbox !== undefined ? item.thirdCheckbox : false;
                            item.repeatDate = item.repeatDate !== undefined ? item.repeatDate : null;
                            item.repeatCount = item.repeatCount !== undefined ? item.repeatCount : 0;
                            item.index = item.index !== undefined ? item.index : idx; // Assign index
                        });
                        allButton.style.fontWeight = 'bold';
                        allButton.style.color = 'red';
                        repeatButton.style.fontWeight = 'normal';
                        repeatButton.style.color = 'white';
                        newButton.style.fontWeight = 'normal';
                        newButton.style.color = 'white';
                        rerepeatButton.style.fontWeight = 'normal';
                        rerepeatButton.style.color = 'white';
                        renderTable(data);
                        setErrorMessage('Data loaded from DB successfully');
                        return;
                    } else {
                        throw new Error('Invalid JSON format from DB');
                    }
                } catch (jsonError) {
                    console.error('Invalid JSON from DB:', jsonError, 'Raw:', text);
                    setErrorMessage('Invalid data from DB, falling back to file');
                }
            } else {
                const errorText = await dbResponse.text();
                console.error('DB error response:', errorText);
                setErrorMessage('No data found in DB, falling back to file');
            }
        } catch (dbError) {
			alert('Error loading from DB: ' + dbError );
            console.error('Error loading from DB:', dbError);
            setErrorMessage('Error loading from DB, falling back to file');
        }

        // Fall back to file
        try {
            console.log('Falling back to fetch:', jsonFile);
            const response = await fetch(jsonFile);
            if (!response.ok) {
                const text = await response.text();
                console.error('Raw file response:', text.substring(0, 200));
                throw new Error(`HTTP error: ${response.status} ${text.substring(0, 200)}`);
            }
            data = await response.json();

            if (!validateJson(data)) {
                throw new Error('Invalid JSON format: expected array of objects with "en" and "ru" properties');
            }

            // Ensure properties exist
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
            setErrorMessage('Data loaded from file successfully');
        } catch (error) {
            console.error('Error loading JSON file:', error);
            setErrorMessage(`Error loading JSON file: ${error.message}`);
        }
    }

    // Function to reload JSON data from server (DB first, then file), ignoring localStorage
    async function reloadFromServer() {
        setErrorMessage('');
        const jsonFile = getUrlParameter('jsondata');

        if (!jsonFile) {
            setErrorMessage('Parameter "jsondata" is missing in the URL');
            return;
        }

        const file_key = jsonFile.replace('.json', '');

        let data = null;

        // Try loading from DB first
        try {
            console.log('Attempting to load from DB via load.php:', file_key);
            const dbResponse = await fetch(`load.php?file_key=${encodeURIComponent(file_key)}`);
            if (dbResponse.ok) {
                const text = await dbResponse.text();
                console.log('Raw DB response:', text.substring(0, 200)); // Log raw response
                try {
                    data = JSON.parse(text);
                    if (validateJson(data)) {
                        setErrorMessage('Data reloaded from DB successfully');
                    } else {
                        throw new Error('Invalid JSON format from DB');
                    }
                } catch (jsonError) {
                    console.error('Invalid JSON from DB:', jsonError, 'Raw:', text);
                    setErrorMessage('Invalid data from DB, falling back to file');
                }
            } else {
                const errorText = await dbResponse.text();
                console.error('DB error response:', errorText);
                setErrorMessage('No data found in DB, falling back to file');
            }
        } catch (dbError) {
            console.error('Error loading from DB:', dbError);
            setErrorMessage('Error loading from DB, falling back to file');
        }

        // If no data from DB, fall back to file
        if (!data) {
            try {
                console.log('Falling back to fetch from file:', jsonFile);
                const fileResponse = await fetch(jsonFile);
                if (!fileResponse.ok) {
                    const text = await fileResponse.text();
                    console.error('Raw file response:', text.substring(0, 200));
                    throw new Error(`HTTP error: ${fileResponse.status} ${text.substring(0, 200)}`);
                }
                data = await fileResponse.json();

                if (!validateJson(data)) {
                    throw new Error('Invalid JSON format: expected array of objects with "en" and "ru" properties');
                }

                setErrorMessage('Data reloaded from file successfully');
            } catch (fileError) {
                console.error('Error reloading from file:', fileError);
                setErrorMessage(`Error reloading from file: ${fileError.message}`);
                return;
            }
        }

        // Ensure properties exist
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

                // Ensure properties exist
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

    // Function to shuffle array (Fisher-Yates shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Function to render table from JSON data
    function renderTable(data, filter = null) {
        tableBody.innerHTML = ''; // Clear existing rows

        let filteredData = data;
        if (filter === 'repeat') {
            filteredData = data.filter(item => !item.repeatCheckbox && item.learnedCheckbox);
            // Random sort
            filteredData = shuffleArray(filteredData);
        } else if (filter === 'new') {
            filteredData = data.filter(item => !item.repeatCheckbox && !item.learnedCheckbox);
        } else if (filter === 'rerepeat') {
            filteredData = data.filter(item => item.repeatCheckbox && item.learnedCheckbox);
            // Sort by:
            // 1) null repeatDate
            // 2) repeatCount <= 3 and repeatDate not null (by repeatCount asc, then repeatDate asc, random within groups)
            // 3) repeatCount > 3 (by repeatDate asc)
            const nullDate = filteredData.filter(item => item.repeatDate === null || pendingChanges[item.index]?.repeatDate === null);
            const count0to3 = filteredData.filter(item => {
                const effectiveCount = pendingChanges[item.index]?.repeatCount !== undefined ? pendingChanges[item.index].repeatCount : item.repeatCount;
                const effectiveDate = pendingChanges[item.index]?.repeatDate !== undefined ? pendingChanges[item.index].repeatDate : item.repeatDate;
                return effectiveCount <= 3 && effectiveDate !== null;
            });
            const countAbove3 = filteredData.filter(item => {
                const effectiveCount = pendingChanges[item.index]?.repeatCount !== undefined ? pendingChanges[item.index].repeatCount : item.repeatCount;
                return effectiveCount > 3;
            });

            // Sort count0to3 by repeatCount ascending, then repeatDate ascending, then random within groups
            const groupedByCountAndDate = {};
            count0to3.forEach(item => {
                const effectiveCount = pendingChanges[item.index]?.repeatCount !== undefined ? pendingChanges[item.index].repeatCount : item.repeatCount;
                const effectiveDate = pendingChanges[item.index]?.repeatDate !== undefined ? pendingChanges[item.index].repeatDate : item.repeatDate;
                const key = `${effectiveCount}_${effectiveDate || ''}`;
                if (!groupedByCountAndDate[key]) {
                    groupedByCountAndDate[key] = [];
                }
                groupedByCountAndDate[key].push(item);
            });
            const sortedCount0to3 = [];
            Object.keys(groupedByCountAndDate)
                .sort((a, b) => {
                    const [countA, dateA] = a.split('_');
                    const [countB, dateB] = b.split('_');
                    const countDiff = parseInt(countA) - parseInt(countB);
                    if (countDiff !== 0) return countDiff;
                    return (dateA || '').localeCompare(dateB || '');
                })
                .forEach(key => {
                    sortedCount0to3.push(...shuffleArray(groupedByCountAndDate[key]));
                });

            // Sort countAbove3 by repeatDate ascending
            countAbove3.sort((a, b) => {
                const dateA = pendingChanges[a.index]?.repeatDate !== undefined ? pendingChanges[a.index].repeatDate : a.repeatDate;
                const dateB = pendingChanges[b.index]?.repeatDate !== undefined ? pendingChanges[b.index].repeatDate : b.repeatDate;
                return (dateA || '').localeCompare(dateB || '');
            });

            // Combine all parts
            filteredData = [...nullDate, ...sortedCount0to3, ...countAbove3];
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

            // Speak cell (Speaker, checkboxes, buttons)
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

            // Checkboxes and buttons based on filter mode
            if (filter === 'new') {
                // Only learnedCheckbox in New mode
                const learnedCheckbox = document.createElement('input');
                learnedCheckbox.type = 'checkbox';
                learnedCheckbox.className = 'learnedCheckbox';
                learnedCheckbox.checked = item.learnedCheckbox || false;
                learnedCheckbox.dataset.index = item.index;
                learnedCheckbox.setAttribute('aria-label', 'Learned Checkbox');
                cellContainer.appendChild(learnedCheckbox);
            } else if (filter === 'repeat') {
                // Only repeatCheckbox in Repeat mode
                const repeatCheckbox = document.createElement('input');
                repeatCheckbox.type = 'checkbox';
                repeatCheckbox.className = 'repeatCheckbox';
                repeatCheckbox.checked = item.repeatCheckbox || false;
                repeatCheckbox.dataset.index = item.index;
                repeatCheckbox.setAttribute('aria-label', 'Repeat Checkbox');
                cellContainer.appendChild(repeatCheckbox);
            } else if (filter === 'rerepeat') {
                // Determine effective repeatDate and repeatCount considering pendingChanges
                const currentDate = getCurrentDate();
                const effectiveRepeatDate = pendingChanges[item.index]?.repeatDate !== undefined ? pendingChanges[item.index].repeatDate : item.repeatDate;
                const effectiveRepeatCount = pendingChanges[item.index]?.repeatCount !== undefined ? pendingChanges[item.index].repeatCount : item.repeatCount;
                const buttonBgColor = effectiveRepeatDate === currentDate ? 'red' : '#2196F3';

                // RepeatCountMinus button
                const repeatCountMinusButton = document.createElement('button');
                repeatCountMinusButton.className = 'increment-button minus-button';
                repeatCountMinusButton.style.backgroundColor = buttonBgColor;
                const minusCountSpan = document.createElement('span');
                minusCountSpan.className = 'increment-count';
                minusCountSpan.textContent = '-';
                repeatCountMinusButton.appendChild(minusCountSpan);
                repeatCountMinusButton.dataset.index = item.index;
                repeatCountMinusButton.setAttribute('aria-label', `Decrement Repeat Count (Current: ${effectiveRepeatCount || 0})`);
                repeatCountMinusButton.addEventListener('click', () => {
                    // Check effective values for repeatDate and repeatCount
                    const currentRepeatDate = pendingChanges[item.index]?.repeatDate !== undefined ? pendingChanges[item.index].repeatDate : item.repeatDate;
                    const currentRepeatCount = pendingChanges[item.index]?.repeatCount !== undefined ? pendingChanges[item.index].repeatCount : item.repeatCount;
                    if (currentRepeatDate === currentDate || currentRepeatCount <= 0) {
                        console.log(`No action: repeatDate=${currentRepeatDate} matches current date=${currentDate} or repeatCount=${currentRepeatCount} for index=${item.index}`);
                        return;
                    }
                    const newCount = (currentRepeatCount || 0) - 1;
                    updateCheckboxState(item.index, newCount, 'repeatCount');
                    updateCheckboxState(item.index, currentDate, 'repeatDate');
                    // Update the repeatCount button display
                    const countSpan = row.querySelector('.increment-button:not(.minus-button) .increment-count');
                    if (countSpan) {
                        countSpan.textContent = newCount;
                    }
                    // Update background colors
                    repeatCountMinusButton.style.backgroundColor = 'red';
                    const incrementButton = row.querySelector('.increment-button:not(.minus-button)');
                    if (incrementButton) {
                        incrementButton.style.backgroundColor = 'red';
                    }
                });
                cellContainer.appendChild(repeatCountMinusButton);

                // RepeatCount button
                const incrementButton = document.createElement('button');
                incrementButton.className = 'increment-button';
                incrementButton.style.backgroundColor = buttonBgColor;
                const countSpan = document.createElement('span');
                countSpan.className = 'increment-count';
                countSpan.textContent = effectiveRepeatCount || 0;
                incrementButton.appendChild(countSpan);
                incrementButton.dataset.index = item.index;
                incrementButton.setAttribute('aria-label', `Increment Repeat Count (Current: ${effectiveRepeatCount || 0})`);
                incrementButton.addEventListener('click', () => {
                    // Check effective repeatDate
                    const currentRepeatDate = pendingChanges[item.index]?.repeatDate !== undefined ? pendingChanges[item.index].repeatDate : item.repeatDate;
                    if (currentRepeatDate === currentDate) {
                        console.log(`No action: repeatDate=${currentRepeatDate} matches current date=${currentDate} for index=${item.index}`);
                        return;
                    }
                    const currentRepeatCount = pendingChanges[item.index]?.repeatCount !== undefined ? pendingChanges[item.index].repeatCount : item.repeatCount;
                    const newCount = (currentRepeatCount || 0) + 1;
                    updateCheckboxState(item.index, newCount, 'repeatCount');
                    updateCheckboxState(item.index, currentDate, 'repeatDate');
                    // Update the displayed count immediately
                    countSpan.textContent = newCount;
                    // Update background colors
                    incrementButton.style.backgroundColor = 'red';
                    const minusButton = row.querySelector('.increment-button.minus-button');
                    if (minusButton) {
                        minusButton.style.backgroundColor = 'red';
                    }
                });
                cellContainer.appendChild(incrementButton);
            } else {
                // Default (All mode): both checkboxes
                const repeatCheckbox = document.createElement('input');
                repeatCheckbox.type = 'checkbox';
                repeatCheckbox.className = 'repeatCheckbox';
                repeatCheckbox.checked = item.repeatCheckbox || false;
                repeatCheckbox.dataset.index = item.index;
                repeatCheckbox.setAttribute('aria-label', 'Repeat Checkbox');
                cellContainer.appendChild(repeatCheckbox);

                const learnedCheckbox = document.createElement('input');
                learnedCheckbox.type = 'checkbox';
                learnedCheckbox.className = 'learnedCheckbox';
                learnedCheckbox.checked = item.learnedCheckbox || false;
                learnedCheckbox.dataset.index = item.index;
                learnedCheckbox.setAttribute('aria-label', 'Learned Checkbox');
                cellContainer.appendChild(learnedCheckbox);
            }

            // Gear button
            const gearButton = document.createElement('button');
            gearButton.className = 'gear-button';
            const gearIcon = document.createElement('img');
            gearIcon.src = 'gear.png'; // Ensure gear.png exists
            gearIcon.alt = 'Options';
            gearButton.appendChild(gearIcon);
            gearButton.dataset.index = item.index; // Use item.index
            cellContainer.appendChild(gearButton);

            speakCell.appendChild(cellContainer);
            row.appendChild(speakCell);

            tableBody.appendChild(row);
        });

        // Store data in dataset
        tableBody.dataset.json = JSON.stringify(data);
    }

    // Function to make cell editable
    function makeCellEditable(cell) {
        const contentDiv = cell.querySelector('.cell-content');
        const textSpan = contentDiv.querySelector('span');
        const originalText = textSpan.textContent;

        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'editable-input';
        textarea.value = originalText;
        textarea.style.height = `${textSpan.scrollHeight}px`; // Match initial height

        // Auto-adjust height on input
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        });

        // Replace content with textarea
        contentDiv.innerHTML = '';
        contentDiv.appendChild(textarea);
        textarea.focus();

        // Save on blur or Enter key
        textarea.addEventListener('blur', saveEdit);
        textarea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                textarea.blur();
            }
        });

        function saveEdit() {
            const newText = textarea.value;
            const index = parseInt(cell.dataset.index, 10);
            const field = cell.dataset.field;
            const data = JSON.parse(tableBody.dataset.json);
            const item = data.find(item => item.index === index);
            if (item) {
                item[field] = newText;
            }
            tableBody.dataset.json = JSON.stringify(data);

            // Restore cell content
            contentDiv.innerHTML = '';
            const newTextSpan = document.createElement('span');
            newTextSpan.textContent = newText;
            const editIcon = document.createElement('button');
            editIcon.className = 'edit-icon';
            const editImg = document.createElement('img');
            editImg.src = 'pencil.png';
            editImg.alt = 'Edit';
            editIcon.appendChild(editImg);
            contentDiv.appendChild(newTextSpan);
            contentDiv.appendChild(editIcon);
        }
    }

    // Function to speak text using Web Speech API
    function speakText(text, lang) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.8; // Slightly slower for clarity
        speechSynthesis.speak(utterance);
    }

    // Function to apply pending checkbox changes to data
    function applyPendingChanges(data) {
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

    // Function to save table data to server (MySQL via PHP)
    async function saveToServer() {
        setErrorMessage('');
        try {
            const jsonFile = getUrlParameter('jsondata');
            if (!jsonFile) {
                throw new Error('Parameter "jsondata" is missing in the URL');
            }

            const file_key = jsonFile.replace('.json', '');

            const data = JSON.parse(tableBody.dataset.json);
            // Apply pending checkbox changes
            const updatedData = applyPendingChanges(data);

            const jsonString = JSON.stringify(updatedData, null, 2);

            const response = await fetch('save.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_key: file_key,
                    json: jsonString
                })
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Raw server response:', text.substring(0, 200));
                throw new Error(`HTTP error: ${response.status} ${text.substring(0, 200)}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error('Server failed to save data');
            }

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
            tableBody.dataset.json = jsonString;
            renderTable(updatedData);
            pendingChanges = {}; // Clear pending changes after successful save

            setErrorMessage('JSON data saved to server successfully');
        } catch (error) {
            console.error('Error saving to server:', error);
            setErrorMessage(`Error saving to server: ${error.message}`);
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
        // Toggle context menu
        if (openContextMenu && openContextMenu.dataset.index === index.toString()) {
            openContextMenu.remove();
            openContextMenu = null;
            return;
        }

        // Close existing menu
        if (openContextMenu) {
            openContextMenu.remove();
            openContextMenu = null;
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.dataset.index = index; // Store index for toggle check

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
        const minusButtonIcon = document.createElement('img');
        minusButtonIcon.src = 'minus.png'; // Ensure minus.png exists
        minusButtonIcon.alt = 'Delete Row';
        minusButton.appendChild(minusButtonIcon);
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
            // Handle increment/decrement button click (handled in renderTable)
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
    saveButton.addEventListener('click', saveToServer);

    // Event listener for Save Local button
    saveLocalButton.addEventListener('click', saveToLocalStorage);

    // Event listeners for filter buttons
    repeatButton.addEventListener('click', filterRepeatRows);
    newButton.addEventListener('click', filterNewRows);
    allButton.addEventListener('click', showAllRows);
    rerepeatButton.addEventListener('click', filterReRepeatRows);

    // Event listener for Reload from Server button
    reloadServerButton.addEventListener('click', reloadFromServer);

    // Event listener for Download Local button
    downloadLocalButton.addEventListener('click', downloadLocalJson);

    // Load JSON data on page load
    loadJsonData();
});