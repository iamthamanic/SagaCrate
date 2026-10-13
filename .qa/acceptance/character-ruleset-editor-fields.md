# Feature: Character Ruleset Editor Fields

## Intent
Der CharacterEditor zeigt den Charakternamen direkt oberhalb der 3D-Charaktervorschau und ersetzt dort generische Vorschau-/Bedienhinweise. Im Info-Tab steuert ein Regelset-Dropdown direkt unter der Beschreibung, welche fachlichen Character-Felder angeboten werden. Das gewählte Regelset und der D&D-5.5e-Hintergrund bleiben beim Speichern strukturiert erhalten.

## Preconditions
- Bestehender CharacterEditor und die vorhandenen Ruleset-Optionen in `src/modules/rulesets/characterCreation.ts` bleiben die Source of Truth.
- Default-Regelset ist `SagaTree Core` (`sagatree-core`).
- Die bereits vorhandene Zuordnung wird beibehalten:
  - SagaTree Core: `Archetyp`, `Rasse`, `Setting`, `Essenzprofil`.
  - Dungeons & Dragons 5.5e: `Klasse`, `Spezies`, `Hintergrund`.
  - `Archetyp` entspricht funktional der D&D-`Klasse`.
  - `Rasse` entspricht funktional der D&D-`Spezies`.
  - `Setting` ist ein SagaTree-Core-Charakterrahmen und wird bei D&D nicht als Character-Dropdown geführt; D&D-Welt-/Kampagnenkontext kommt separat aus Projekt/World-Lore.
  - `Essenzprofil` ist ein SagaTree-Core-Konzept ohne direktes D&D-5.5e-Äquivalent und entfällt bei D&D.
  - D&D `Hintergrund` ist ein eigenes D&D-Character-Creation-Feld und kein Ersatz für SagaTree `Setting` oder `Essenzprofil`.
- Ruleset-Wechsel darf keine regelsetfremden Werte im UI oder in der Persistenz stehen lassen.
- `supabase/migrations/005_character_ruleset_metadata.sql` stellt `characters.ruleset_key` und `characters.dnd_background` bereit. Bestehende Rows defaulten auf `sagatree-core`.

## Happy Path
- [x] Direkt oberhalb der 3D-Vorschau wird der aktuelle Charaktername sichtbar; bei leerem Namen steht `Unbenannt`.
- [x] Der generische Ready-/Titeltext wie `Live 3D Vorschau` sowie der permanente Hinweis `Ziehen zum Drehen · Mausrad/Trackpad zum Zoomen` werden entfernt; Loading-/Error-Zustände bleiben sichtbar.
- [x] Direkt unter `Beschreibung` steht das Dropdown `Regelset` mit `SagaTree Core` und `Dungeons & Dragons 5.5e`; Default ist `SagaTree Core`.
- [x] Bei `SagaTree Core` werden `Archetyp`, `Rasse`, `Setting` und `Essenzprofil` angezeigt; bei `Dungeons & Dragons 5.5e` werden stattdessen `Klasse`, `Spezies` und `Hintergrund` angezeigt.
- [x] Ein Regelset-Wechsel setzt regelsetabhängige Auswahlwerte kontrolliert zurück und verwendet weiterhin den neutralen Human-Avatar als sicheren visuellen Startwert.
- [x] Beim Character-Save wird `ruleset_key` strukturiert gespeichert; für D&D 5.5e wird zusätzlich `dnd_background` separat von der freien `background_story` persistiert.

## Edge Cases
- [x] Ein leerer Charaktername verursacht keinen leeren Preview-Titel, sondern zeigt `Unbenannt`.
- [x] Loading- und Error-Status der 3D-Runtime bleiben trotz entferntem Ready-Label verständlich sichtbar.
- [x] D&D-Spezies ohne eigenes 3D-Preset verwenden weiterhin den vorhandenen neutralen Humanoid-Fallback.
- [x] Custom-Setting wird nur bei SagaTree Core und nur bei Auswahl `Custom` angezeigt.
- [x] Bestehende Character-Rows ohne `ruleset_key` werden im ViewModel rückwärtskompatibel als `sagatree-core` gelesen.
- [x] Beim Speichern/Aktualisieren eines SagaTree-Core-Characters wird kein alter D&D-Hintergrund weitergetragen.
- [x] Typed-strict: alle geänderten TypeScript-Dateien bleiben ohne `any`, `@ts-ignore`, `@ts-nocheck` oder vergleichbare Type-Escapes.

## Regression
- [x] Portrait-Generierung, Avatar-Rotation/Zoom, Levelanzeige und Preview-Stats bleiben funktional.
- [x] Character-Lore-Context erhält weiterhin regelsetkorrekte Labels und sendet bei D&D kein SagaTree-Setting/Essenzprofil.
- [x] Bestehende Cyan/Gold-Interaktionshierarchie und Shared-UI-Primitives bleiben konsistent (Cyan = CTA/Selected, Gold = Hover).
- [x] Regelset-Persistenz verwendet keine erfundete UUID in `ruleset_id`; der stabile Editor-Key bleibt unabhängig von optionalen Ruleset-Katalog-Datensätzen.

## Screenshots
- `.qa/evidence/feat-character-studio-avatar/02-info-sagatree-core.png`
- `.qa/evidence/feat-character-studio-avatar/03-info-dnd-5-5e.png`
- Playwright `e2e/character-editor.spec.ts` PASS

## Implementation Notes
- `src/modules/rulesets/characterCreation.ts` bleibt die Source of Truth für die beiden Character-Creation-Regelsets und ihre Feldsets.
- Der CharacterEditor startet mit `sagatree-core`; das `Regelset`-Select steht direkt unter `Beschreibung`, und `handleRulesetChange` leert regelsetabhängige lokale Werte vor dem Wechsel.
- `CharacterEditor.handleSaveCharacter` übergibt `ruleset_key: ruleset` und bei D&D `dnd_background`; `character.service.ts` persistiert beide Felder und liest fehlende Altwerte als `sagatree-core`.
- `supabase/migrations/005_character_ruleset_metadata.sql` ergänzt die beiden Spalten, beschränkt `ruleset_key` auf `sagatree-core`/`dnd-5.5e` und entfernt D&D-Hintergründe aus SagaTree-Core-Rows.
- Der Charaktername (`characterName || 'Unbenannt'`) bleibt im Preview-Card-Header unmittelbar oberhalb des Canvas sichtbar.
- `AvatarCanvas` zeigt den Runtime-Status nur noch während `loading` oder `error`; der permanente Bedienhinweis wurde entfernt, OrbitControls bleiben aktiv.
- Der Test Gate enthält zusätzlich `scripts/character-editor-regression-check.mjs`, das Ruleset-Persistenz, den neuesten Avatar-Look nach asynchronem Model-Load und Legacy-`archived`-Projektstatus als Regression-Contract prüft.
- GitHub Quality Gates auf Code-/Doku-Head `096ff0592af9957b24ddfd4d86e281b15ea3c44d`: Test Gate PASS; Composition Gate erwartungsgemäß noch auf einen neuen Proof wartend; Browser E2E im selben Lauf wird als UI-Hard-Gate verwendet.
