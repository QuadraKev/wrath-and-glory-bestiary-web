// Web API shim - replaces Electron's window.api with browser-native equivalents

window.api = {
    // Load game data via fetch
    loadGameData: async (filename) => {
        const response = await fetch('data/' + filename);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        return response.json();
    },

    // Save encounter file as browser download
    saveEncounterFile: async (encounterData, suggestedName) => {
        const name = (suggestedName || 'encounter').replace(/\.encounter$/, '');
        const blob = new Blob([JSON.stringify(encounterData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name + '.encounter';
        a.click();
        URL.revokeObjectURL(url);
        return { success: true, fileName: name };
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

    // Save players file as browser download
    savePlayersFile: async (playerData) => {
        const blob = new Blob([JSON.stringify(playerData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'players.players';
        a.click();
        URL.revokeObjectURL(url);
        return { success: true };
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
    if (typeof EncounterState !== 'undefined' &&
        EncounterState.hasUnsavedChanges() &&
        !EncounterState.isEmpty()) {
        e.preventDefault();
    }
});
