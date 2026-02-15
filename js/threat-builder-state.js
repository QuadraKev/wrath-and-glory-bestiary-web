// Threat Builder State - State management for the Threat Builder

const ThreatBuilderState = {
    // Ability type constants (ordered for display)
    ABILITY_TYPES: [
        'BATTLECRY', 'ACTION', 'RUIN', 'WRATH', 'COMPLICATION',
        'REACTION', 'DETERMINATION', 'ANNIHILATION', 'TRAIT', 'PASSIVE', 'MOB', 'ABILITY'
    ],

    // The current threat being edited
    threat: null,

    // Indexes built lazily from all threats
    _abilityIndex: null, // Map<type, Array<{ability, threatName, threatId}>>
    _bonusIndex: null,   // Array<{bonus, threatName, threatId}>

    // Track unsaved state
    _isDirty: false,

    // Snapshot of the last-injected threat data (without id) for change detection
    _lastInjectedSnapshot: null,

    // Initialize with an empty threat
    init() {
        this.clear();
    },

    // Build indexes from all threats (lazy, called once on first use)
    buildIndex() {
        if (this._abilityIndex) return;

        this._abilityIndex = new Map();
        this._bonusIndex = [];

        // Initialize ability type buckets
        this.ABILITY_TYPES.forEach(type => {
            this._abilityIndex.set(type, []);
        });

        const threats = DataLoader.getAllThreats();

        // Track seen abilities to deduplicate (keyed by name+type)
        const seenAbilities = new Set();

        threats.forEach(threat => {
            // Index abilities
            if (threat.abilities) {
                threat.abilities.forEach(ability => {
                    const type = ability.type || 'ABILITY';
                    if (!this._abilityIndex.has(type)) {
                        this._abilityIndex.set(type, []);
                    }

                    // Deduplicate Champion into a single generic entry
                    if (ability.name === 'Champion') {
                        if (seenAbilities.has('Champion')) return;
                        seenAbilities.add('Champion');
                        this._abilityIndex.get(type).push({
                            ability: {
                                type: ability.type,
                                name: 'Champion',
                                description: 'This Threat may use Ruin Actions and has X personal Ruin.'
                            },
                            threatName: '(Generic)',
                            threatId: null
                        });
                        return;
                    }

                    this._abilityIndex.get(type).push({
                        ability: ability,
                        threatName: threat.name,
                        threatId: threat.id
                    });
                });
            }

            // Index bonuses
            if (threat.bonuses) {
                threat.bonuses.forEach(bonus => {
                    this._bonusIndex.push({
                        bonus: bonus,
                        threatName: threat.name,
                        threatId: threat.id
                    });
                });
            }
        });
    },

    // Get abilities by type from the index
    getAbilitiesByType(type) {
        this.buildIndex();
        return this._abilityIndex.get(type) || [];
    },

    // Get all indexed bonuses
    getAllBonuses() {
        this.buildIndex();
        return this._bonusIndex;
    },

    // Load a threat as template (deep copy)
    loadTemplate(threatId) {
        const threat = DataLoader.getThreat(threatId);
        if (!threat) return;

        this.threat = JSON.parse(JSON.stringify(threat));
        // Give it a new custom ID
        this.threat.id = this._generateId();
        this._isDirty = true;
        this._lastInjectedSnapshot = null;
    },

    // Update a field by dot-path (e.g., 'attributes.S', 'name')
    updateField(path, value) {
        const parts = path.split('.');
        let obj = this.threat;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) obj[parts[i]] = {};
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
        this._isDirty = true;
    },

    // Add an ability (deep copy)
    addAbility(ability) {
        if (!this.threat.abilities) this.threat.abilities = [];
        this.threat.abilities.push(JSON.parse(JSON.stringify(ability)));
        this._isDirty = true;
    },

    // Remove ability by index
    removeAbility(index) {
        if (this.threat.abilities && index >= 0 && index < this.threat.abilities.length) {
            this.threat.abilities.splice(index, 1);
            this._isDirty = true;
        }
    },

    // Update a field on an ability
    updateAbility(index, field, value) {
        if (this.threat.abilities && this.threat.abilities[index]) {
            this.threat.abilities[index][field] = value;
            this._isDirty = true;
        }
    },

    // Reorder ability (move from one index to another)
    reorderAbility(fromIndex, toIndex) {
        if (!this.threat.abilities) return;
        const abilities = this.threat.abilities;
        if (fromIndex < 0 || fromIndex >= abilities.length) return;
        if (toIndex < 0 || toIndex >= abilities.length) return;
        const [moved] = abilities.splice(fromIndex, 1);
        abilities.splice(toIndex, 0, moved);
        this._isDirty = true;
    },

    // Add a bonus (deep copy)
    addBonus(bonus) {
        if (!this.threat.bonuses) this.threat.bonuses = [];
        this.threat.bonuses.push(JSON.parse(JSON.stringify(bonus)));
        this._isDirty = true;
    },

    // Remove bonus by index
    removeBonus(index) {
        if (this.threat.bonuses && index >= 0 && index < this.threat.bonuses.length) {
            this.threat.bonuses.splice(index, 1);
            this._isDirty = true;
        }
    },

    // Update a field on a bonus
    updateBonus(index, field, value) {
        if (this.threat.bonuses && this.threat.bonuses[index]) {
            this.threat.bonuses[index][field] = value;
            this._isDirty = true;
        }
    },

    // Add a keyword
    addKeyword(keyword) {
        if (!this.threat.keywords) this.threat.keywords = [];
        if (keyword && keyword.trim()) {
            this.threat.keywords.push(keyword.trim().toUpperCase());
            this._isDirty = true;
        }
    },

    // Remove keyword by index
    removeKeyword(index) {
        if (this.threat.keywords && index >= 0 && index < this.threat.keywords.length) {
            this.threat.keywords.splice(index, 1);
            this._isDirty = true;
        }
    },

    // Get a clean threat object for preview/save/injection
    getThreatData() {
        return JSON.parse(JSON.stringify(this.threat));
    },

    // Check if builder has unsaved work
    hasUnsavedChanges() {
        return this._isDirty;
    },

    // Check if builder is empty (nothing meaningful entered)
    isEmpty() {
        if (!this.threat) return true;
        return !this.threat.name && (!this.threat.abilities || this.threat.abilities.length === 0);
    },

    // Reset to empty threat
    clear() {
        this.threat = {
            id: this._generateId(),
            name: '',
            source: 'Custom',
            quote: '',
            attribution: '',
            description: '',
            tierThreat: { '1': 'T', '2': 'T', '3': '-', '4': '-' },
            keywords: [],
            attributes: { S: 1, T: 1, A: 1, I: 1, Wil: 1, Int: 1, Fel: 1 },
            resilience: { value: 1, note: '' },
            defence: 1,
            defenceNote: '',
            wounds: 1,
            shock: 1,
            skills: '',
            abilities: [],
            bonuses: [],
            determination: '',
            conviction: 0,
            resolve: 0,
            speed: 6,
            speedNote: '',
            size: 'Average',
            mobOptions: '',
            mobAbilities: ''
        };
        this._isDirty = false;
        this._lastInjectedSnapshot = null;
    },

    // Save the current threat to a .threat file
    async saveThreatToFile() {
        const data = this.getThreatData();
        const suggestedName = (data.name || 'custom-threat').replace(/[^a-zA-Z0-9_-]/g, '-');
        const result = await window.api.saveThreatFile(data, suggestedName);
        if (result.success) {
            this._isDirty = false;
        }
        return result;
    },

    // Load a .threat file into the builder
    async loadThreatFromFile() {
        const result = await window.api.loadThreatFile();
        if (result.success && result.data) {
            this.threat = result.data;
            // Ensure it has a valid ID
            if (!this.threat.id || !this.threat.id.startsWith('custom_')) {
                this.threat.id = this._generateId();
            }
            this._isDirty = true;
        }
        return result;
    },

    // Inject/update the current threat in DataLoader cache and add one to the encounter
    injectIntoEncounter() {
        const data = this.getThreatData();
        if (!data.name) {
            return { success: false, error: 'Threat must have a name' };
        }
        // Compare current data (minus id) against the last-injected snapshot.
        // If the threat has changed, assign a new ID so previous copies keep their stats.
        const snapshot = JSON.stringify({ ...data, id: null });
        if (this._lastInjectedSnapshot && snapshot !== this._lastInjectedSnapshot) {
            const newId = this._generateId();
            this.threat.id = newId;
            data.id = newId;
        }
        this._lastInjectedSnapshot = snapshot;

        DataLoader.injectThreat(data);
        App.updateThreatCount();
        // Add one individual referencing this threat
        const ids = EncounterState.addIndividual(data.id, 1, false);
        return { success: true, name: data.name, addedToEncounter: ids.length > 0 };
    },

    // Generate a unique custom threat ID
    _generateId() {
        return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
};
