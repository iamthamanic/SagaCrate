# Feature: Unified Atlas – technischer Multi-Scale-Zoom-Spike

<!-- /implement · 2026-10-16 -->

## Intent
SagaTree soll statt separater Welt-, Städte- und Battlemap-Editoren einen einheitlichen Kartenviewport erhalten, der durch natürliches Zoomen zwischen räumlich verankerten Detailstufen wechselt. **Diese erste Lieferung ist ein nachprüfbarer Phase-1-Spike**, nicht der versprochene finale Inkarnate-Zeicheneditor. Die späteren Artistik-, Generator- und Persistenzphasen stehen im Designartefakt.

Roadmap: kein `.qa/design/product-roadmap.md` im Repository vorhanden; Phase 1 des vom Nutzer bestätigten Unified-Atlas-Auftrags.

## Preconditions
- Eine Welt mit bestehendem Kartenprofil und optionalen Pins existiert.
- Weltkartenansicht oder Saga → Welt ist geöffnet.
- Die bestehenden Karten-RPCs, RLS-Regeln und Session-Overlays bleiben unverändert.

## Happy Path – Phase 1
- [ ] Die bestehende Weltkarte lässt sich weiterhin laden und bearbeiten.
- [ ] Innerhalb **derselben Kartenoberfläche** wird ein separater, ausdrücklich als Demonstration gekennzeichneter Multi-Scale-Zoommodus aufrufbar.
- [ ] Mausrad oder Zoom-Buttons verändern den Fokus maßstabsgerecht; der unter dem Cursor liegende Ort bleibt räumlich verankert.
- [ ] Welt-, Stadt- und Innenraumebene bilden einen räumlich gekoppelten Scene Graph; Zoomen in eine vorhandene Detailregion aktiviert deren Ebene ohne harte Navigation.
- [ ] Herauszoomen führt an derselben verankerten Stelle wieder auf die übergeordnete Ebene.
- [ ] Fehlende Detailkarten werden nicht künstlich als kanonische Weltinhalte dargestellt; Demonstrationsinhalte sind sichtbar als Beispiel markiert.
- [ ] Ein reiner Geometrie-/LOD-Test prüft Koordinatenrundreisen, Grenzwerte und Hysterese.

## Edge Cases
- [ ] Zoom an Grenzwerten pendelt nicht unkontrolliert zwischen Ebenen.
- [ ] Zoom und Pan liefern keine NaN-/Infinity-Koordinaten.
- [ ] Kleine Karten und leere Bereiche zeigen keinen fehlerhaften Fallback.
- [ ] Spielerinformationen bleiben durch die bestehenden get_world_map-Projektionen beschränkt; neue Demo fordert keine Geheimdaten an.

## Regression
- [ ] Die Weltkarte bleibt in Weltenverwaltung und Saga benutzbar.
- [ ] Bestehende Pins, Tiles, Party-Marker und WorldProfileIds bleiben unangetastet.
- [ ] Kein neues Auth-, API- oder Migration-Verhalten in diesem Spike.
- [ ] Architekturgrenzen (domains ohne React/Supabase) bleiben erhalten.

## Assumptions
- Die im Repo vorhandene Saga-Welt-Navigation ist der bereits etablierte Einstiegspunkt.
- Der Spike darf **keine** zusätzliche Weltinformation persistent speichern.
- Die endgültige Rendererwahl (PixiJS/MapLibre/Leaflet) erfolgt erst nach einem gesonderten Integrations- und Performancevergleich.

## Security Coverage
- Kein neuer Serverendpunkt, keine SQL-Migration, kein neuer Upload.
- Bestehende projektspezifische Kartenrechte und serverseitige Geheimnis-Projektion bleiben unverändert.
- Der Spike rendert lokale Beispiel-Geometrie; keine frei ladbaren externen URLs, kein HTML aus fremden Inhalten.

## Screenshots
| Step | Filename |
|---|---|
| 1 Weltkarte | `01-world-map.png` |
| 2 Zoom in Stadt | `02-city-zoom.png` |
| 3 Zoom in Raum | `03-room-zoom.png` |
| 4 Wieder hinaus | `04-world-return.png` |

## Implementation Notes
- Wird nach Umsetzung ausgefüllt.
