<div align="center">

<img src="docs/brand/sagadrive-logo.png" width="148" alt="SagaDrive Logo" />

# SagaDrive

**Webbasierte TTRPG-Plattform für Spielleitung und Spieler**

Kampagnen planen · Charaktere bauen · Sessions live führen · Welten und Inventar verwalten

[![React](https://img.shields.io/badge/React_18-061B24?style=flat-square&logo=react&logoColor=06B6D4)](#tech-stack)
[![Vite](https://img.shields.io/badge/Vite_6-061B24?style=flat-square&logo=vite&logoColor=E8A641)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-061B24?style=flat-square&logo=typescript&logoColor=0891B2)](#tech-stack)
[![Supabase](https://img.shields.io/badge/Supabase_Self--Host-061B24?style=flat-square&logo=supabase&logoColor=3ECF8E)](#backend--self-host)
[![Tailwind](https://img.shields.io/badge/Tailwind_4-061B24?style=flat-square&logo=tailwindcss&logoColor=06B6D4)](#design--uiux)

[Figma Design](https://www.figma.com/design/XyboDSHba8TNFw0Bb5uUs4/SagaDrive) · [Theme Guide](src/THEME_GUIDE.md) · [Self-Host](README_SELFHOST.md) · [Architektur](src/ARCHITECTURE.md)

</div>

---

## Überblick

SagaDrive ist eine dunkle, werkzeugartige TTRPG-Oberfläche — kein generisches Gaming-Dashboard. Das Repo enthält das **React + Vite**-Frontend mit **selbst gehostetem Supabase-Stack** (Auth, Postgres, Storage, Realtime, Edge Functions) und einer klaren Schichtenarchitektur:

`domains` → `infrastructure` → `app` · UI-Primitives in `shared/ui`

| Rolle | Nutzen |
| --- | --- |
| **Spielleitung** | Projekte, Sessions, Bibliothek, Weltprofile, Live-Steuerung |
| **Spieler** | Charaktereditor (SagaDrive Core), Inventar, Session-Join, Look / LiveAct |
| **Creator** | Items, NPCs, Avatar-Assets, optional Meshy 2D/3D (BYOK) |

---

## Features

| Bereich | Was drin ist |
| --- | --- |
| **Projekte & Mitgliedschaft** | Sagas anlegen, Join-by-Code, RLS-gesicherte Rollen (GM / Spieler) |
| **SagaDrive Core Editor** | Spezies · Parameter · Look · Inventar · Einstellungen / Presets |
| **Live Sessions** | Lobby, GM- und Player-Panel, Realtime Session-Runtime |
| **Bibliothek & Welten** | Abenteuer, World Profiles, Maps |
| **Inventar & Items** | Inventory v2, Item-Workbench, Thumbnails & optional GLB |
| **LiveAct** | MediaPipe Face Tracking, Avatar-Capabilities, Kalibrierung |
| **KI (optional)** | Character-Lore, Portraits, Meshy Text-to-Image / Image-to-3D |
| **Marketplace & Rulesets** | Erweiterbare Inhalte und Regelwerke |
| **Adaptive UI** | Phone / Tablet / Desktop-Rekomposition (`AU-*` Experience Contract) |

---

## Design & UI/UX

SagaDrive folgt einer klaren Markenidentität aus dem Logo: **Teal für Auswahl & CTA**, **Gold für Hover & Premium**. Surfaces bleiben dunkel und ruhig — professionell und fokussiert.

<div align="center">

| | Primär | Akzent | Surface |
| :---: | :---: | :---: | :---: |
| **Dark** | `#06B6D4` | `#F59E0B` | `#0F172A` |
| **Light** | `#0891B2` | `#E8A641` | `#FFFFFF` |

<img src="docs/brand/sagadrive-mark.svg" width="56" alt="SagaDrive Mark" />

</div>

**Gestaltungsprinzipien**

- **Werkzeug zuerst** — klare Hierarchie, wenig Dekoration, hohe Lesbarkeit
- **Zwei Markenrollen** — Cyan = Auswahl / primäre Aktion · Gold = Hover / Premium
- **Imagination First** — Visualisierung unterstützt das Spiel, ersetzt es nicht
- **Adaptive Content Width** — Journey/Session folgt der Main-Pane (`@container/main`)
- **Radix + Tailwind** — zugängliche Primitives, Tokens in `src/styles/globals.css`

| Dokument | Inhalt |
| --- | --- |
| [`src/THEME_GUIDE.md`](src/THEME_GUIDE.md) | Kanonische CI, Farbrollen, Control-Affordances |
| [`docs/ui-styleguide.md`](docs/ui-styleguide.md) | UI-Komponenten & Patterns |
| [`docs/concepts/adaptive-ui-experience-contract.md`](docs/concepts/adaptive-ui-experience-contract.md) | Mobile / Touch / Safe Areas / `AU-*` |
| [`docs/concepts/conductor-experience-contract.md`](docs/concepts/conductor-experience-contract.md) | Performance Mode, Live-Steuerung, Motion |
| [`docs/concepts/imagination-first-visualization-contract.md`](docs/concepts/imagination-first-visualization-contract.md) | Scenes, 2D/3D, Visual Authority |

---

## Tech Stack

| Schicht | Technologie |
| --- | --- |
| Frontend | React 18 · Vite 6 · TypeScript · Tailwind CSS 4 |
| UI | Radix UI · shadcn-basierte Primitives (`src/shared/ui`) |
| 3D / Avatar | Three.js · `@pixiv/three-vrm` · MediaPipe Face Landmarker |
| Backend | Self-hosted Supabase: Postgres · GoTrue · PostgREST · Storage · Realtime · Kong · Deno Edge |
| Qualität | Playwright · `test-gate` · `composition-gate` · Architecture Boundary Check |
| Deploy | Docker Compose Self-Host (Vite-Build → `build/`) |

Dev-Server: **`http://localhost:3004`** (`vite.config.ts` → `server.port = 3004`)

---

## Quick Start

**Voraussetzungen:** Node.js 20+ · npm 10+ · für Edge-Diffs im Gate: Deno LTS

```bash
npm install
npm run dev
```

Produktions-Build:

```bash
npm run build   # Output: build/
```

Umgebungsvariablen: siehe [`.env.example`](.env.example). Secrets nie mit `VITE_` / `NEXT_PUBLIC_` ins Client-Bundle legen.

Self-Host-Stack (Docker): → **[`README_SELFHOST.md`](README_SELFHOST.md)**  
Migrationen anwenden: `bash scripts/apply-migrations.sh <migration.sql>`

---

## Architektur

Modularer Monolith mit harten Importgrenzen (CI-enforced):

```text
src/
├── app/              # Vertikale Slices / User Journeys
├── domains/          # Reine Domain-Verträge & SagaDrive-Core-Regeln
├── infrastructure/   # Supabase-, Storage-, Three-/LiveAct-Adapter
├── shared/ui/        # Fachlich neutrale UI-Primitives
├── lib/              # Auth, Supabase-Client, Querschnitt
└── styles/           # Theme-Tokens (globals.css)
```

| Layer | Darf importieren | Darf nicht |
| --- | --- | --- |
| `domains/` | stdlib, sibling domains | React, UI, Supabase, `app/` |
| `infrastructure/` | domains, `lib/supabase` | React, `shared/ui`, `app/` |
| `app/<area>/` | domains, infrastructure, `shared/ui`, andere Areas nur über Public Barrel | direkte Supabase-Calls, fremde Private-Dateien |

`src/modules/**` und `src/components/**` sind **entfernt** — Neu anlegen bricht den Architecture Gate. Details: [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md).

---

## SagaDrive Core Character Editor

„Charakter erstellen“ öffnet einen Zwei-Karten-Chooser (eigener Charakter vs. Preset). Der Editor hat fünf Haupttabs:

**Spezies** · **Parameter** · **Look** · **Inventar** · **Einstellungen** (`Statistik` / `Preset`)

SagaDrive Core ist kein umbenanntes D&D: Begriffe wie **Spezies**, **Archetyp**, **Essenz**, **Ausdauer**, **Verstand**, **Wahrnehmung**; Startverteilung `4,3,3,2,2,1`; 18 Core-Fertigkeiten; Speziesmerkmale `3/3` Punkte. Inventar v2: **20 Basisplätze** + Ausrüstung, Traglast `5 + 2 × Stärke`.

Persistenz (Auszug): `attributes` · `skills` · `sagadrive_profile` · `background_story` · `notes`  
Legacy-Keys (`constitution` → Ausdauer usw.) werden beim Lesen normalisiert.

Regeln & Validierung: [`docs/sagadrive core rules.md`](docs/sagadrive%20core%20rules.md) · [`docs/inventory-v2.md`](docs/inventory-v2.md)

---

## KI, Portraits & Meshy

| Feature | Edge / Storage | Hinweis |
| --- | --- | --- |
| Character-Lore | `character-lore` | Provider: `ollama` / `openai-compatible`; Keys nie im Browser |
| Portraits | Bucket `character-portraits` | Owner-scoped, signierte URLs |
| Item 2D | Meshy Text-to-Image → `item-thumbnails` | Prod: User-BYOK |
| Item 3D | Meshy Image-to-3D → `item-models` | GLB max. 50 MB; Bibliothek zeigt nur Thumbnails |
| Avatar-Katalog | Manifeste + optional `VITE_AVATAR_ASSET_BASE_URL` | Lizenzierte / gepinnte Assets — siehe [`docs/avatar assets.md`](docs/avatar%20assets.md) |

Wichtige Server-Env (Edge / Host — **nicht** im Vite-Bundle):

```bash
CHARACTER_AI_PROVIDER=ollama
CHARACTER_AI_RATE_LIMIT_PER_MINUTE=6
CHARACTER_AI_ALLOWED_ORIGIN=http://localhost:3004
CREDENTIALS_ENCRYPTION_KEY=
# MESHY_API_KEY=                 # nur lokal/CI mit AI_PROVIDER_ALLOW_HOST_KEYS=1
# AI_PROVIDER_ALLOW_HOST_KEYS=1
```

CORS ist fail-closed (kein Default `*`). Rate-Limits laufen persistent über Postgres-RPCs.

---

## Backend & Self-Host

Kern-Services für den Produktbetrieb:

**Postgres · Auth · PostgREST · Storage · Realtime · Kong**  
Edge / Ollama / Meshy sind **optional** für AI-Features. Studio/Meta sind Dev-Tooling.

Relevante Character-/Asset-Migrationen (Reihenfolge):

```text
002_character_trait_arrays.sql
003_character_lore_rate_limits.sql
004_project_membership_security.sql
005_character_ruleset_metadata.sql
006_character_portrait_storage.sql
007_sagadrive_character_profile.sql
008_world_profiles.sql
009_character_adventure_arcs.sql
010_characters_v3_columns.sql
011_seed_local_admin.sql
012_character_presets.sql
013_character_presets_rls_hardening.sql
014_character_abilities_emotion_profiles.sql
015_inventory_item_definitions.sql
016_character_inventory_v2.sql
017_item_thumbnail_assets.sql
018_item_model3d_assets.sql
020_user_ai_provider_credentials.sql
```

Bei Schema V3 zuerst die kanonischen RLS-Policies aus `src/supabase/schema_v3_rls.sql` anwenden, danach die Migrationen oben.  
Self-Host: [`README_SELFHOST.md`](README_SELFHOST.md) · Deploy: [`src/supabase/DEPLOY_V3.md`](src/supabase/DEPLOY_V3.md)

---

## Quality Gates

Auf Push / PR gegen `main`:

```bash
npm run test-gate          # Lint, Typecheck, Build, Deno, Contracts, Secrets-Scan, Architecture
npm run composition-gate   # Semantische Multi-Hop-Proofs
npm run test:e2e           # Playwright (Chromium)
```

Lokal:

```bash
npx playwright install chromium
npm run test:e2e
```

Agent-Konfiguration: [`.cursor/`](.cursor/) — vor Änderungen: `npx ecc-agentshield scan --path .cursor`

---

## Projektstruktur

```text
sagadrive/
├── src/                 # Frontend (app · domains · infrastructure · shared · lib)
├── supabase/            # migrations · functions · config
├── public/              # Favicons, MediaPipe, Item-/NPC-Assets
├── docs/                # Regeln, Styleguides, Brand, Concepts
│   └── brand/           # Logo & Mark für Doku / README
├── e2e/ · scripts/ · assets/
├── docker-compose*.yml
├── README.md
└── README_SELFHOST.md
```

---

## Dokumentation

| Thema | Pfad |
| --- | --- |
| Self-Host | [`README_SELFHOST.md`](README_SELFHOST.md) |
| Integration | [`INTEGRATION.md`](INTEGRATION.md) |
| Feature-Vergleich | [`FEATURE_COMPARISON.md`](FEATURE_COMPARISON.md) |
| Architektur | [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md) |
| Auth / Supabase Setup | [`src/AUTH_SETUP.md`](src/AUTH_SETUP.md) · [`src/SUPABASE_SETUP.md`](src/SUPABASE_SETUP.md) |
| Items | [`docs/items.md`](docs/items.md) |
| Inventory v2 | [`docs/inventory-v2.md`](docs/inventory-v2.md) |
| Avatar Assets | [`docs/avatar assets.md`](docs/avatar%20assets.md) |
| World Profiles | [`docs/world profiles.md`](docs/world%20profiles.md) |
| Deploy V3 | [`src/supabase/DEPLOY_V3.md`](src/supabase/DEPLOY_V3.md) |

---

## Recent changes

- **2026-10-11** — Backend-Audit: Variant A (Supabase-Stack optimieren); Realtime/`SECRET_KEY_BASE` & Footprint dokumentiert
- **2026-10-10** — Adaptive Content-Width: Journey/Session Join folgt Main-Pane (`AdaptiveJourneyColumn`, AU-CONTENT-WIDTH)
- **2026-10-10** — Character-Editor: Human-Vorlage lädt Preview-LOD (~10 MB); Speichern bleibt face3
- **2026-10-07** — Starttemplates: Icons + Playstyle-Tooltips; Editor-Hinweise bei offenen Lücken
- **2026-09-30** — Bibliothek Abenteuer: GM kann Leiten und Teilnehmen von derselben Karte
- **2026-09-25** — LiveAct Face Setup: Auto Mapping, Kopfachsen, Kalibrierung, Motion-Test
- **2026-09-21** — LiveAct Face Asset Contract / Validator / Capabilities

---

## Hinweise

- `npm run dev` öffnet den Browser automatisch (`server.open = true`).
- Port `3004` belegt → Prozess beenden oder Port in `vite.config.ts` anpassen.
- Original Design-Basis: [Figma · SagaDrive](https://www.figma.com/design/XyboDSHba8TNFw0Bb5uUs4/SagaDrive)

<div align="center">

<br />

<img src="docs/brand/sagadrive-mark.svg" width="40" alt="" />

<br />

<sub>SagaDrive · Teal <code>#0891B2</code> · Gold <code>#E8A641</code></sub>

</div>
