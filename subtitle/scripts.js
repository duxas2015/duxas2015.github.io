document.addEventListener('DOMContentLoaded', () => {
    const modeSwitch = document.getElementById('modeSwitch');
    const saveBtn = document.getElementById('saveBtn');

    if (typeof subData !== 'undefined') renderTable();

    modeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('edit-mode', modeSwitch.checked);
    });

    if (saveBtn) saveBtn.addEventListener('click', saveChanges);
});

function renderTable() {
    const tbody = document.getElementById('subBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    subData.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td class="edit-col col-idx">
                <div contenteditable="true" class="val-en_tag">${row.en_tag || ''}</div>
                <div class="actions-container">
                    <span class="btn-row btn-add" onclick="editRow('en', 'add', ${index})">A</span>
                    <span class="btn-row btn-rem" onclick="editRow('en', 'rem', ${index})">R</span>
                </div>
            </td>
            <td class="edit-col col-time">
                <div contenteditable="true" class="val-en_time">${row.en_time || ''}</div>
            </td>
            <td contenteditable="true" class="val-en_text">${row.en_text || ''}</td>
            <td contenteditable="true" class="val-ru_text">${row.ru_text || ''}</td>
            <td class="edit-col col-idx">
                <div contenteditable="true" class="val-ru_tag">${row.ru_tag || ''}</div>
                <div class="actions-container">
                    <span class="btn-row btn-add" onclick="editRow('ru', 'add', ${index})">A</span>
                    <span class="btn-row btn-rem" onclick="editRow('ru', 'rem', ${index})">R</span>
                </div>
            </td>
            <td class="edit-col col-time">
                <div contenteditable="true" class="val-ru_time">${row.ru_time || ''}</div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function syncDataFromDOM() {
    const rows = document.querySelectorAll('#subBody tr');
    rows.forEach((tr, i) => {
        const getVal = (sel) => {
            const el = tr.querySelector(sel);
            return el ? el.innerText.trim() : '';
        };

        subData[i] = {
            en_tag: getVal('.val-en_tag'),
            en_time: getVal('.val-en_time'),
            en_text: getVal('.val-en_text'),
            ru_text: getVal('.val-ru_text'),
            ru_tag: getVal('.val-ru_tag'),
            ru_time: getVal('.val-ru_time')
        };
    });
}

function editRow(side, type, index) {
    syncDataFromDOM();

    if (type === 'add') {
        subData.push({en_tag:'', en_time:'', en_text:'', ru_tag:'', ru_time:'', ru_text:''});
        for (let i = subData.length - 1; i > index; i--) {
            subData[i][side + '_tag'] = subData[i - 1][side + '_tag'];
            subData[i][side + '_time'] = subData[i - 1][side + '_time'];
            subData[i][side + '_text'] = subData[i - 1][side + '_text'];
        }
        subData[index][side + '_tag'] = '';
        subData[index][side + '_time'] = '';
        subData[index][side + '_text'] = '';
    } else if (type === 'rem') {
        for (let i = index; i < subData.length - 1; i++) {
            subData[i][side + '_tag'] = subData[i + 1][side + '_tag'];
            subData[i][side + '_time'] = subData[i + 1][side + '_time'];
            subData[i][side + '_text'] = subData[i + 1][side + '_text'];
        }
        const last = subData[subData.length - 1];
        last[side + '_tag'] = ''; last[side + '_time'] = ''; last[side + '_text'] = '';
        if (!last.en_text && !last.ru_text && !last.en_time && !last.ru_time) subData.pop();
    }
    renderTable();
}

async function saveChanges() {
    syncDataFromDOM();
    const resp = await fetch('update_details.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subId, rows: subData })
    });
    const res = await resp.json();
    alert(res.success ? "Сохранено" : "Ошибка: " + res.error);
}