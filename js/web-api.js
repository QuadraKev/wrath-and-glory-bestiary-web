// Web API shim - replaces Electron's window.api with browser-native equivalents

// Helper: save data to a file, using File System Access API > Web Share API > blob download
async function _saveFile(json, fileName, pickerOptions) {
    // Try File System Access API (desktop browsers)
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker(pickerOptions);
            const writable = await handle.createWritable();
            await writable.write(new Blob([json], { type: 'application/json' }));
            await writable.close();
            const savedName = handle.name.replace(/\.[^.]+$/, '');
            return { success: true, fileName: savedName };
        } catch (e) {
            if (e.name === 'AbortError') return { success: false };
            return { success: false, error: e.message };
        }
    }

    // Try Web Share API (avoids Chrome Android blob download bugs)
    if (navigator.share) {
        try {
            const file = new File([json], fileName, { type: 'application/json' });
            await navigator.share({ files: [file] });
            const savedName = fileName.replace(/\.[^.]+$/, '');
            return { success: true, fileName: savedName };
        } catch (e) {
            if (e.name === 'AbortError') return { success: false };
            console.warn('Web Share API failed, falling back to download:', e.name, e.message);
        }
    }

    // Last resort: blob download (known to produce 0 KB files in Chrome Android)
    const blob = new Blob([json], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    const savedName = fileName.replace(/\.[^.]+$/, '');
    return { success: true, fileName: savedName };
}

window.api = {
    // Load game data via fetch
    loadGameData: async (filename) => {
        const response = await fetch('data/' + filename);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        return response.json();
    },

    // Save encounter file via Save As dialog
    saveEncounterFile: async (encounterData, suggestedName) => {
        const name = (suggestedName || 'encounter').replace(/\.encounter$/, '');
        const json = JSON.stringify(encounterData, null, 2);
        return _saveFile(json, name + '.encounter', {
            suggestedName: name + '.encounter',
            types: [{ description: 'Encounter Files', accept: { 'application/json': ['.encounter'] } }]
        });
    },

    // Load encounter file via file picker
    loadEncounterFile: () => {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.encounter,.json';
            input.onchange = async () => {
                if (!input.files || !input.files[0]) {
                    resolve({ success: false, error: 'No file selected' });
                    return;
                }
                try {
                    const text = await input.files[0].text();
                    const data = JSON.parse(text);
                    const fileName = input.files[0].name.replace(/\.(encounter|json)$/, '');
                    resolve({ success: true, data, fileName });
                } catch (e) {
                    resolve({ success: false, error: 'Failed to read file: ' + e.message });
                }
            };
            input.oncancel = () => resolve({ success: false, error: 'Cancelled' });
            input.click();
        });
    },

    // Save players file via Save As dialog
    savePlayersFile: async (playerData) => {
        const json = JSON.stringify(playerData, null, 2);
        return _saveFile(json, 'players.players', {
            suggestedName: 'players.players',
            types: [{ description: 'Player Files', accept: { 'application/json': ['.players'] } }]
        });
    },

    // Load players file via file picker
    loadPlayersFile: () => {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.players,.json';
            input.onchange = async () => {
                if (!input.files || !input.files[0]) {
                    resolve({ success: false, error: 'No file selected' });
                    return;
                }
                try {
                    const text = await input.files[0].text();
                    const data = JSON.parse(text);
                    resolve({ success: true, data });
                } catch (e) {
                    resolve({ success: false, error: 'Failed to read file: ' + e.message });
                }
            };
            input.oncancel = () => resolve({ success: false, error: 'Cancelled' });
            input.click();
        });
    },

    // Save threat file via Save As dialog
    saveThreatFile: async (threatData, suggestedName) => {
        const name = (suggestedName || 'custom-threat').replace(/\.threat$/, '');
        const json = JSON.stringify(threatData, null, 2);
        return _saveFile(json, name + '.threat', {
            suggestedName: name + '.threat',
            types: [{ description: 'Threat Files', accept: { 'application/json': ['.threat'] } }]
        });
    },

    // Load threat file via file picker
    loadThreatFile: () => {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.threat,.json';
            input.onchange = async () => {
                if (!input.files || !input.files[0]) {
                    resolve({ success: false, error: 'No file selected' });
                    return;
                }
                try {
                    const text = await input.files[0].text();
                    const data = JSON.parse(text);
                    const fileName = input.files[0].name.replace(/\.(threat|json)$/, '');
                    resolve({ success: true, data, fileName });
                } catch (e) {
                    resolve({ success: false, error: 'Failed to read file: ' + e.message });
                }
            };
            input.oncancel = () => resolve({ success: false, error: 'Cancelled' });
            input.click();
        });
    },

    // Close confirmation via beforeunload
    onCheckUnsavedChanges: () => {
        // Handled by beforeunload event below
    },
    respondUnsavedChanges: () => {
        // No-op in web version
    }
};

// Set up beforeunload for unsaved changes warning
window.addEventListener('beforeunload', (e) => {
    const encounterUnsaved = typeof EncounterState !== 'undefined' &&
        EncounterState.hasUnsavedChanges() &&
        !EncounterState.isEmpty();
    const builderUnsaved = typeof ThreatBuilderState !== 'undefined' &&
        ThreatBuilderState.hasUnsavedChanges() &&
        !ThreatBuilderState.isEmpty();
    if (encounterUnsaved || builderUnsaved) {
        e.preventDefault();
    }
});
