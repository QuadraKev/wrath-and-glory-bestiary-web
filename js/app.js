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

        // Initialize threat builder state
        ThreatBuilderState.init();
        console.log('Threat builder state initialized.');

        // Set up close confirmation listener
        this.initCloseConfirmation();

        // Initialize UI components
        this.initTabNavigation();

        // Initialize tab modules
        SettingsTab.init();
        ThreatsTab.init();
        GlossaryTab.init();
        EncounterTab.init();
        ThreatBuilderTab.init();

        // Update threat count
        this.updateThreatCount();

        // Check for auto-saved state
        this.checkAutoSave();

        // Handle deep link from URL hash
        this.handleDeepLink();
        window.addEventListener('hashchange', () => this.handleDeepLink());

        console.log('Application initialized.');
    },

    // Handle deep link navigation from URL hash
    handleDeepLink() {
        const hash = location.hash;
        if (!hash || hash.length < 2) return;

        const parts = hash.substring(1).split('/');
        const section = parts[0];
        const id = parts.slice(1).join('/');

        if (section === 'threats' && id) {
            this.switchTab('threats');
            ThreatsTab.selectThreat(id);
        } else if (section === 'glossary' && id) {
            this.switchTab('glossary');
            GlossaryTab.navigateToEntry(id);
        }
    },

    // Initialize close confirmation handler
    initCloseConfirmation() {
        window.api.onCheckUnsavedChanges(() => {
            const encounterUnsaved = EncounterState.hasUnsavedChanges() && !EncounterState.isEmpty();
            const builderUnsaved = ThreatBuilderState.hasUnsavedChanges() && !ThreatBuilderState.isEmpty();
            const hasChanges = encounterUnsaved || builderUnsaved;
            const encounterData = encounterUnsaved ? EncounterState.getEncounterData() : null;
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
        } else if (tabName === 'builder') {
            ThreatBuilderTab.refresh();
        } else if (tabName === 'encounter') {
            EncounterTab.refresh();
        } else if (tabName === 'settings') {
            SettingsTab.refresh();
        }
    },

    // Update threat count display
    updateThreatCount() {
        const threats = DataLoader.getAllThreats();
        document.getElementById('threat-count').textContent = `${threats.length} Threats`;
    },

    // ===== Auto-Save Restore =====

    // Check for auto-saved state on startup and auto-load it
    checkAutoSave() {
        // Restore encounter auto-save (including any custom threats)
        const saved = EncounterState.getAutoSave();
        if (saved && saved.encounter) {
            // Inject top-level custom threats first (belt-and-suspenders with loadFromData)
            if (saved.customThreats) {
                saved.customThreats.forEach(t => DataLoader.injectThreat(t));
            }
            EncounterState.loadFromData(saved.encounter);
            this.updateThreatCount();
            this.switchTab('encounter');
            EncounterTab.refresh();
        }

        // Restore threat builder auto-save
        const builderSave = ThreatBuilderState.getAutoSave();
        if (builderSave && builderSave.threat) {
            ThreatBuilderState.loadFromAutoSave(builderSave.threat);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
