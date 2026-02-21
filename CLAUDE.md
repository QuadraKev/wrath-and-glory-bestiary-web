# Wrath & Glory Bestiary

Web-based threat/NPC reference tool for the Wrath & Glory tabletop RPG.

## Architecture

Vanilla JavaScript with global object pattern (no modules/bundling). Each file defines a global `const` object (e.g., `const EncounterTab = {...}`). No build step -- served directly as static files.

- `js/app.js` - Main controller, tab navigation, threat count display
- `js/data-loader.js` - Async JSON loading with caching, threat/weapon lookups
- `js/encounter-state.js` - Encounter state management (individuals, mobs, player characters, initiative, file persistence)
- `js/glossary.js` - Tooltip system for game terms
- `js/threat-builder-state.js` - Custom threat builder state management
- `js/web-api.js` - Browser API shim (file save/load using File System Access API with download fallback; iOS detection to skip `accept` attribute)
- `tabs/threats-tab.js` - Threat list, button-based toggle filters, detail view
- `tabs/encounter-tab.js` - Encounter builder UI (sidebar settings, initiative list, detail panel)
- `tabs/threat-builder-tab.js` - Custom threat editor with ability/bonus picker
- `tabs/glossary-tab.js` - Glossary browser tab
- `tabs/settings-tab.js` - Settings tab with source book filtering (gold toggle buttons)
- `tabs/references-tab.js` - Reference browser for game data categories (searchable, filterable)
- `css/styles.css` - Unified dark theme with CSS variables
- `index.html` - Main HTML structure with tab layout

## Data Files

All game data lives in `data/` as JSON:

| File | Contents |
|------|----------|
| `threats.json` | All threat/NPC stat blocks (~784 threats) |
| `threat-weapons.json` | Weapons used by threats (subset -- many threat ACTION abilities reference weapons by `weaponId` that aren't in this file; those abilities use an inline `stats` field as fallback) |
| `equipment.json` | Equipment and augmetics (synced from creator app) for References tab |
| `glossary.json` | Game terms for tooltip system (synced with creator app's glossary) |

### Source Values

Each threat entry has a `source` field using these full-name identifiers (different from the creator app's lowercase values):
- `"Core Rules"`
- `"Abundance of Apocrypha"`
- `"Church of Steel"`
- `"Redacted Records I"` / `"Redacted Records II"`
- `"Threat Assessment: Xenos"`
- `"Threat Assessment: Daemons & Heretics"`
- `"Vow of Absolution"`
- 10 Apocryphal Adversaries sources (e.g., `"Apocryphal Adversaries: Orks"`)

### Key Data Format Patterns

- **tierThreat**: Object with keys `"1"`-`"5"`, values `"A"` (Adversary), `"E"` (Elite), `"T"` (Troop), `"MC"` (Mob/Crew), `"-"` (not applicable)
- **Shock**: Use `"-"` string for creatures without shock (daemons, constructs, etc.)
- **Speed**: Always integer; use `speedNote` for additional info like `"Flight"`
- **IDs**: Apocrypha-sourced IDs use `_aaa` suffix to avoid conflicts with official content
- **Abilities**: ACTION type abilities may have a `weaponId` (referencing `threat-weapons.json`) and/or inline `stats` field. When rendering, always fall back to `stats` if the weapon lookup fails.

## Encounter Builder

The Encounter Builder (`tabs/encounter-tab.js` + `js/encounter-state.js`) manages combat encounters:

- **Sidebar**: Tier, player count, player character inputs (name + initiative + remove button), save/load players, sort by initiative
- **Initiative List**: Drag-and-drop reordering, wound/shock trackers, multi-select for forming mobs, bonus (Elite/Adversary) dropdown
- **Detail Panel**: Full stat block, wound/shock controls, notes, mob management (split, disband, add/remove members)
- **Player Characters**: Managed via sidebar inputs; removal via X buttons decrements player count. PCs appear in initiative list but are only removable from sidebar.
- **File I/O**: Uses `showSaveFilePicker()` (Save As dialog) with auto-download fallback. File types: `.encounter`, `.players`, `.threat`

## Glossary

The glossary (`data/glossary.json`) should be kept in sync with the creator app's glossary. Both apps share identical categories: `characterTerms`, `conditions`, `combatTerms`, `terms`, `weaponTraits`, `armorTraits`, `keywords`, `psychicPowers`. If new terms are added to one app, copy them to the other.

## Workflow Rules

- **Cache busting**: When modifying CSS or JS files, bump the `?v=N` query string on ALL affected `<script>` and `<link>` tags in `index.html`. Always bump all version numbers together.
- **GitHub Issues**: Do NOT resolve/close issues until the user confirms they are resolved. After closing an issue, post a comment summarizing the fix/change (what was wrong, what was changed, relevant commit hash).
- **Commits**: Push using the QuadraKev-bot PAT (stored in Claude Code auto-memory, not in this file).

## Books Available (PDF)

Source material PDFs are available locally for reference:
- Official sourcebooks: Core Rulebook, Forsaken System, Church of Steel, Aeldari Inheritance of Embers, Redacted Records I & II, Vow of Absolution
- Official bestiary: Threat Assessment Daemons & Heretics, Threat Assessment Xenos
- Homebrew: An Abundance of Apocrypha v9, 10 Apocryphal Adversaries books

**Important**: Always use the Read tool to read PDFs visually for maximum accuracy. All sourcebook PDFs are fully intact. Prefer visual reading over `pdftotext` (which garbles 2-column layouts).

## Work Completed

1. **Core Rules**: All threats included
2. **Threat Assessment D&H**: 59 threats added
3. **Threat Assessment Xenos**: All threats included
4. **Aeldari Inheritance of Embers**: Threats verified
5. **Apocryphal Adversaries**: 486 threats from 10 books added (total: 784 threats)
6. **Adventure Modules**: Checked 11 books -- only adventure-specific NPCs, no general content to add
7. **Encounter Builder**: Full encounter management with individuals, mobs, player characters, initiative tracking, drag-and-drop ordering, wound/shock tracking, file save/load (Save As), threat import, custom threat builder
8. **Glossary sync**: Bestiary glossary synced with creator (all 300 psychic powers + all other categories)
9. **Source book + page annotations**: All threats annotated with source book + page number. `DataLoader.formatSourcePage()` / `getSourceDisplayName()`. Glossary entries also annotated.
10. **Mobile layout fixes**: `#app` uses `position: fixed; inset: 0` instead of `height: 100vh`. Header/tab-nav/footer use `flex-shrink: 0`. Tab nav scrollbar hidden. Sidebar-backdrop inside `#app` (stacking context). Mobile: threat name/quote/source centered.
11. **Tier 5 filter**: Added Tier 5 to dropdown. MC (Monstrous Creature) treated as Adversary in filter logic.
12. **Comprehensive data audit**: Glossary synced with 482 corrections from creator app's visual PDF audit (1,184 total issues fixed across all creator data files). Includes fixed game mechanics (corruption_test, shock, resilience, regroup, respite, stealth_score), renamed psychic power keys (Minor Invocation→Malefic Invitation, Warpspeed→Warptime), and `[AI-Generated]` annotations for entries with no source PDF text.
13. **Bestiary filter redesign**: Converted threat filters to button-based toggle UI with vertically stacked uniform-width buttons. Simplified sidebar to single scrolling column.
14. **In-text reference removal**: Stripped inline page references from data descriptions. The `source`/`page` fields are preserved — only redundant in-text citations removed.
15. **Settings tab**: Added dedicated Settings tab with source book filtering via gold toggle buttons.
16. **References tab**: Searchable, filterable reference browser for Weapons, Armor, Augmetics, Equipment, Psychic Powers, Species Abilities, and Mutations. Species abilities deduplicated across variants.
17. **Augmetics separation**: Synced equipment.json from creator (36 new augmetic entries, 67 total). Separated augmetics as their own category in References tab with dedicated filter button and body renderer showing Effect, Bonuses, Keywords, Value/Rarity.
18. **Glossary & References performance**: Deferred body rendering (empty body with `data-deferred`, materialized on first expand), progressive rendering (batches of 100 entries on scroll), event delegation (single click listener on container via `e.target.closest()`), and search debounce (200-300ms). Applies to both `glossary-tab.js` and `references-tab.js`.
19. **iOS fixes**: File loading — omit `<input accept="...">` on iOS to avoid Safari forcing .JSON extension on custom file types (.encounter, .players, .threat). Glossary tooltips — prevent double-open on tap by clearing hover timer in click handler and checking `data-glossary-key` for duplicate popups.
