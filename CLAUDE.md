# Wrath & Glory Bestiary

Web-based threat/NPC reference tool for the Wrath & Glory tabletop RPG.

## Architecture

Vanilla JavaScript with global object pattern (no modules/bundling). Served directly as static files. No build step.

## Data Files

All game data lives in `data/` as JSON:

| File | Contents |
|------|----------|
| `threats.json` | All threat/NPC stat blocks |
| `threat-weapons.json` | Weapons used by threats |
| `glossary.json` | Game terms for tooltip system |

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

## Workflow Rules

- **Cache busting**: When modifying CSS or JS files, bump the `?v=N` query string on ALL affected `<script>` and `<link>` tags in `index.html`. Always bump all version numbers together.
- **GitHub Issues**: Do NOT resolve/close issues until the user confirms they are resolved.
- **Commits**: Push using the QuadraKev-bot PAT (stored in Claude Code auto-memory, not in this file).

## Books Available (PDF)

Source material PDFs are available locally for reference:
- Official sourcebooks: Core Rulebook, Forsaken System, Church of Steel, Aeldari Inheritance of Embers, Redacted Records I & II, Vow of Absolution
- Official bestiary: Threat Assessment Daemons & Heretics, Threat Assessment Xenos
- Homebrew: An Abundance of Apocrypha v9, 10 Apocryphal Adversaries books

Note: `pdftotext` is installed for text extraction. 2-column PDFs may produce garbled text.

## Work Completed

1. **Core Rules**: All threats included
2. **Threat Assessment D&H**: 59 threats added
3. **Threat Assessment Xenos**: All threats included
4. **Aeldari Inheritance of Embers**: Threats verified
5. **Apocryphal Adversaries**: 486 threats from 10 books added (total: 784 threats)
6. **Adventure Modules**: Checked 11 books -- only adventure-specific NPCs, no general content to add
