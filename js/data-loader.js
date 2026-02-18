// Data Loader - Loads game data from JSON files

const DataLoader = {
    // Cache for loaded data
    cache: {},

    // Faction definitions - maps faction names to keywords that indicate membership
    factionKeywordMap: {
        'Adeptus Astartes': ['ADEPTUS ASTARTES', '[CHAPTER]'],
        'Adeptus Mechanicus': ['ADEPTUS MECHANICUS', '[FORGE WORLD]', 'QUESTOR MECHANICUS', 'LEGIO CYBERNETICA', 'SERBERYS', 'AVACHRUS FORGE WORLD'],
        'Aeldari': ['AELDARI', 'ASURYANI', '[CRAFTWORLD]', 'HARLEQUIN', '[MASQUE]', 'ANHRATHE', 'ASPECT WARRIOR', 'WRAITH CONSTRUCT'],
        'Chaos': ['CHAOS', 'DAEMON', '[MARK OF CHAOS]', '[LEGION]'],
        'Drukhari': ['DRUKHARI', '[KABAL]', '[COTERIE]', '[COVEN]', '[HAEMONCULUS COVEN]', '[WYCH CULT]', 'COURT OF THE ARCHON', 'PAIN ENGINE'],
        'Genestealer Cult': ['GENESTEALER CULT', 'GENESTEALER'],
        'Heretic': ['HERETIC'],
        'Imperium': ['IMPERIUM', 'IMPERIAL', 'MUTANT', 'SCUM', 'SERVITOR'],
        'Khorne': ['KHORNE'],
        'Kroot': ['KROOT'],
        'Necron': ['NECRON', '[DYNASTY]', 'CANOPTEK', 'CRYPTEK', 'DESTROYER', 'DESTROYER CULT', 'FLAYER', 'TRIARCH'],
        'Nurgle': ['NURGLE', 'MARK OF NURGLE'],
        'Ork': ['ORK', '[CLAN]', 'GROT', 'SQUIG'],
        'Primaris': ['PRIMARIS'],
        'Slaanesh': ['SLAANESH'],
        "T'au": ["T'AU", 'VESPID', 'DRONE'],
        'Tyranid': ['TYRANID'],
        'Tzeentch': ['TZEENTCH'],
        'Adeptus Custodes': ['ADEPTUS CUSTODES', '[SHIELD HOST]'],
        'Harlequin': ['HARLEQUIN', '[MASQUE]', '[SAEDATH]'],
        'Leagues of Votann': ['LEAGUES OF VOTANN', 'KIN', '[LEAGUE]']
    },

    // Load a single data file
    async loadFile(filename) {
        if (this.cache[filename]) {
            console.log(`[DataLoader] Cache hit for ${filename}`);
            return this.cache[filename];
        }

        try {
            console.log(`[DataLoader] Loading ${filename}...`);
            const data = await window.api.loadGameData(filename);
            if (data) {
                this.cache[filename] = data;
                console.log(`[DataLoader] Loaded ${filename}:`, Array.isArray(data) ? `${data.length} items` : 'object');
            } else {
                console.warn(`[DataLoader] No data returned for ${filename}`);
            }
            return data;
        } catch (error) {
            console.error(`[DataLoader] Failed to load ${filename}:`, error);
            return null;
        }
    },

    // Load all game data files
    async loadAll() {
        console.log('[DataLoader] Starting to load all game data...');

        const files = [
            'threats.json',
            'threat-weapons.json',
            'glossary.json'
        ];

        const results = await Promise.all(files.map(f => this.loadFile(f)));

        const gameData = {
            threats: results[0] || [],
            threatWeapons: results[1] || [],
            glossary: results[2] || {}
        };

        console.log('[DataLoader] All data loaded. Summary:', {
            threats: gameData.threats.length,
            threatWeapons: gameData.threatWeapons.length
        });

        return gameData;
    },

    // Get all threats
    getAllThreats() {
        return this.cache['threats.json'] || [];
    },

    // Get threat by ID
    getThreat(id) {
        const threats = this.getAllThreats();
        return threats.find(t => t.id === id);
    },

    // Get all threat weapons
    getAllThreatWeapons() {
        return this.cache['threat-weapons.json'] || [];
    },

    // Get threat weapon by ID
    getThreatWeapon(id) {
        const weapons = this.getAllThreatWeapons();
        return weapons.find(w => w.id === id);
    },

    // Get glossary data
    getGlossary() {
        return this.cache['glossary.json'] || {};
    },

    // Load glossary (for Glossary.init compatibility)
    async loadGlossary() {
        if (!this.cache['glossary.json']) {
            await this.loadFile('glossary.json');
        }
        return this.cache['glossary.json'];
    },

    // Get all unique keywords from threats
    getAllKeywords() {
        const threats = this.getAllThreats();
        const keywordSet = new Set();

        threats.forEach(threat => {
            if (threat.keywords && Array.isArray(threat.keywords)) {
                threat.keywords.forEach(kw => keywordSet.add(kw));
            }
        });

        return Array.from(keywordSet).sort();
    },

    // Get all faction names (sorted)
    getAllFactions() {
        return Object.keys(this.factionKeywordMap).sort();
    },

    // Get factions for a specific threat based on its keywords
    getThreatFactions(threat) {
        if (!threat || !threat.keywords) return [];

        const factions = [];
        const threatKeywords = threat.keywords.map(kw => kw.toUpperCase());

        for (const [faction, factionKeywords] of Object.entries(this.factionKeywordMap)) {
            const hasFaction = factionKeywords.some(fkw =>
                threatKeywords.some(tkw => tkw === fkw.toUpperCase() || tkw.includes(fkw.toUpperCase()))
            );
            if (hasFaction) {
                factions.push(faction);
            }
        }

        return factions;
    },

    // Map lowercase source IDs (used in glossary) to display names
    sourceDisplayNames: {
        'core': 'Core Rulebook',
        'church': 'Church of Steel',
        'aeldari': 'Aeldari Inheritance of Embers',
        'fspg': "Forsaken System Player's Guide",
        'voa': 'Vow of Absolution',
        'redacted1': 'Redacted Records I',
        'redacted2': 'Redacted Records II',
        'shotguns': 'Departmento Munitorum Shotguns',
        'dh': 'Threat Assessment: Daemons & Heretics',
        'apocrypha': 'An Abundance of Apocrypha'
    },

    // Get display name for a source (handles both lowercase IDs and full names)
    getSourceDisplayName(source) {
        return this.sourceDisplayNames[source] || source || '';
    },

    // Format source + page for display (e.g. "Core Rules, p. 327")
    // Uses the full individual book name, not the collapsed normalizeSource() name
    formatSourcePage(item) {
        if (!item || !item.source) return '';
        const name = this.getSourceDisplayName(item.source);
        if (item.page != null) {
            return `${name}, p. ${item.page}`;
        }
        return name;
    },

    // Normalize source name for display (combines all Apocrypha sources)
    normalizeSource(source) {
        if (source && source.toLowerCase().includes('apocrypha')) {
            return 'Apocrypha';
        }
        return source;
    },

    // Get all unique source values from threats (sorted), with Apocrypha sources combined
    getAllSources() {
        const threats = this.getAllThreats();
        const sourceSet = new Set();
        threats.forEach(threat => {
            if (threat.source) {
                sourceSet.add(this.normalizeSource(threat.source));
            }
        });
        return Array.from(sourceSet).sort();
    },

    // Inject a custom threat into the cache at runtime
    injectThreat(threat) {
        const threats = this.cache['threats.json'] || [];
        // Remove existing custom threat with same ID if re-injecting
        const idx = threats.findIndex(t => t.id === threat.id);
        if (idx !== -1) threats.splice(idx, 1);
        threats.push(threat);
        this.cache['threats.json'] = threats;
    },

    // Remove a threat from the cache by ID
    removeThreat(threatId) {
        const threats = this.cache['threats.json'] || [];
        this.cache['threats.json'] = threats.filter(t => t.id !== threatId);
    },

    // Filter threats by criteria
    filterThreats(criteria = {}) {
        let threats = this.getAllThreats();

        // Filter by search text
        if (criteria.search) {
            const searchLower = criteria.search.toLowerCase();
            threats = threats.filter(t =>
                t.name.toLowerCase().includes(searchLower) ||
                (t.description && t.description.toLowerCase().includes(searchLower))
            );
        }

        // Filter by tier and threat levels
        // MC (Monstrous Creature) is treated as equivalent to A (Adversary)
        if (criteria.threatLevels && criteria.threatLevels.length > 0) {
            const matchesLevel = (level) => {
                if (!level || level === '-') return false;
                const normalized = level === 'MC' ? 'A' : level;
                return criteria.threatLevels.includes(normalized);
            };
            threats = threats.filter(t => {
                if (!t.tierThreat) return false;

                if (criteria.selectedTier) {
                    // If a specific tier is selected, check only that tier's threat level
                    return matchesLevel(t.tierThreat[criteria.selectedTier]);
                } else {
                    // If no tier selected (all tiers), check if any tier matches
                    return Object.values(t.tierThreat).some(matchesLevel);
                }
            });
        }

        // Filter by keywords
        if (criteria.keywords && criteria.keywords.length > 0) {
            threats = threats.filter(t => {
                if (!t.keywords) return false;
                return criteria.keywords.some(kw => t.keywords.includes(kw));
            });
        }

        // Filter by factions
        if (criteria.factions && criteria.factions.length > 0) {
            threats = threats.filter(t => {
                const threatFactions = this.getThreatFactions(t);
                return criteria.factions.some(f => threatFactions.includes(f));
            });
        }

        // Filter by sources (inclusion - using normalized source names)
        if (criteria.sources && criteria.sources.length > 0) {
            threats = threats.filter(t => criteria.sources.includes(this.normalizeSource(t.source)));
        }

        // Filter by excluded sources (exclusion pattern - using normalized source names)
        if (criteria.excludedSources && criteria.excludedSources.length > 0) {
            threats = threats.filter(t => !criteria.excludedSources.includes(this.normalizeSource(t.source)));
        }

        return threats;
    }
};
