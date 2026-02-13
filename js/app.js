// Main Application Controller

const App = {
    // Current active main tab
    currentTab: 'threats',

    // Initialize the application
    async init() {
        console.log('Initializing Wrath & Glory Bestiary...');

        // Load game data
        const gameData = await DataLoader.loadAll();
        console.log('Game data loaded:', Object.keys(gameData));

        // Initialize glossary system
        await Glossary.init();
        console.log('Glossary initialized.');

        // Initialize encounter state
        EncounterState.init();
        console.log('Encounter state initialized.');

        // Set up close confirmation listener
        this.initCloseConfirmation();

        // Initialize UI components
        this.initTabNavigation();

        // Initialize tab modules
        ThreatsTab.init();
        GlossaryTab.init();
        EncounterTab.init();

        // Update threat count
        this.updateThreatCount();

        // Check for auto-saved state
        this.checkAutoSave();

        console.log('Application initialized.');
    },

    // Initialize close confirmation handler
    initCloseConfirmation() {
        window.api.onCheckUnsavedChanges(() => {
            const hasChanges = EncounterState.hasUnsavedChanges() && !EncounterState.isEmpty();
            const encounterData = hasChanges ? EncounterState.getEncounterData() : null;
            window.api.respondUnsavedChanges(hasChanges, encounterData);
        });
    },

    // Initialize top tab navigation
    initTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
    },

    // Switch to a different main tab
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab button states
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        // Trigger tab-specific refresh
        if (tabName === 'glossary') {
            GlossaryTab.refresh();
        } else if (tabName === 'threats') {
            ThreatsTab.refresh();
        } else if (tabName === 'encounter') {
            EncounterTab.refresh();
        }
    },

    // Update threat count display
    updateThreatCount() {
        const threats = DataLoader.getAllThreats();
        document.getElementById('threat-count').textContent = `${threats.length} Threats`;
    },

    // ===== Auto-Save Restore =====

    // Check for auto-saved state on startup
    checkAutoSave() {
        const saved = EncounterState.getAutoSave();
        if (saved) {
            this.showRestoreBanner(saved.timestamp);
        }
    },

    // Show the restore banner
    showRestoreBanner(timestamp) {
        const banner = document.createElement('div');
        banner.className = 'autosave-banner';
        banner.id = 'autosave-banner';

        const date = new Date(timestamp);
        const timeStr = date.toLocaleString();

        banner.innerHTML = `
            <span class="autosave-text">Unsaved encounter found from <strong>${timeStr}</strong></span>
            <div class="autosave-actions">
                <button class="autosave-btn-restore" id="autosave-restore">Restore</button>
                <button class="autosave-btn-dismiss" id="autosave-dismiss">Dismiss</button>
            </div>
        `;

        const tabNav = document.querySelector('.tab-nav');
        tabNav.parentNode.insertBefore(banner, tabNav.nextSibling);

        document.getElementById('autosave-restore').addEventListener('click', () => {
            this.restoreAutoSave();
        });
        document.getElementById('autosave-dismiss').addEventListener('click', () => {
            EncounterState.clearAutoSave();
            this.removeRestoreBanner();
        });
    },

    // Restore auto-saved state
    restoreAutoSave() {
        const saved = EncounterState.getAutoSave();
        if (!saved || !saved.encounter) return;

        EncounterState.loadFromData(saved.encounter);
        this.switchTab('encounter');
        EncounterTab.refresh();
        this.removeRestoreBanner();
    },

    // Remove the restore banner with animation
    removeRestoreBanner() {
        const banner = document.getElementById('autosave-banner');
        if (!banner) return;
        banner.classList.add('autosave-banner-hide');
        setTimeout(() => banner.remove(), 300);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
