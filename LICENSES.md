# SagaTree Lizenzstruktur

SagaTree nutzt getrennte Lizenzen für Software, Spielregeln und Inhalte.

| Bereich | Lizenz |
| --- | --- |
| Eigener Softwarecode (Frontend, Backend, Rules Engine, Migrationen, eigene Skripte) | **AGPL-3.0-only**, siehe [LICENSE](LICENSE) |
| Kanonisches [SagaTree Core Regelwerk](docs/sagadrive%20core%20rules.md) | **Open RPG Creative (ORC) License** für ORC Licensed Material; Reserved Material ausgeschlossen |
| Künftige separat veröffentlichte SDKs und Clientbibliotheken | **Apache-2.0** vorgesehen; aktuell existiert noch **kein** als Apache-2.0 freigegebenes eigenständiges SDK |
| Marken, Logos, charakteristische Welten, Illustrationen und fremde Medien | Keine pauschale Freigabe durch die Softwarelizenz; jeweils gesonderte Rechte |
| Spieler- und Marketplace-Inhalte | Lizenz des jeweiligen Rechteinhabers; keine automatische AGPL- oder ORC-Lizenz |

**Wichtig:** Der programmierte Regelkern unter `src/domains/rules/sagatree/` ist Software und damit AGPL-lizenziert. Nur das ausdrücklich bezeichnete schriftliche Regelmaterial ist unter ORC freigegeben. ORC ist keine Softwarecode-Lizenz.

Die AGPL erlaubt sowohl Self-Hosting als auch kommerzielles Hosting. Wer eine modifizierte AGPL-Anwendung Nutzern über ein Netzwerk zugänglich macht, muss die entsprechenden Quellcodepflichten einhalten (Abschnitt 13). AGPL verbietet keine konkurrierenden Cloud-Angebote.

Apache-2.0 für ein zukünftiges SDK wird erst dann wirksam, wenn konkreter SDK-Code mitsamt der zugehörigen Lizenzangabe separat veröffentlicht ist. Ein öffentliches API oder ein SDK unter Apache-2.0 beseitigt nicht automatisch etwaige AGPL-Pflichten eng gekoppelter Erweiterungen.

## Drittmaterial und Rechtsvorbehalte

AGPL-3.0-only betrifft nur Material, für das die Rechteinhaber eine entsprechende Lizenz erteilen dürfen. Abhängigkeiten, Fonts, Bilder, Logos, 3D-Modelle, Sounds, Screenshots und bestehende Drittanbieter-Attributionen behalten ihre eigenen Bedingungen. Nicht pauschal von AGPL umfasst sind insbesondere `assets/`, `public/assets/`, `src/assets/`, `docs/brand/` und `docs/screenshots/`. Herkunftshinweise stehen unter anderem in [src/Attributions.md](src/Attributions.md), [docs/avatar assets.md](docs/avatar%20assets.md) und [public/assets/avatars/reference/ATTRIBUTION.md](public/assets/avatars/reference/ATTRIBUTION.md).

Fremde Spielsysteme wie D&D, Pathfinder oder DSA erhalten durch diese Lizenzstruktur keine zusätzlichen Nutzungsrechte. Für eigene Marketplace-Inhalte müssen Rechteinhaber eigene Lizenzen und erforderliche Attributionen festlegen.

Die Verwendung der Namen und Zeichen SagaTree/SagaTree Core als Marken sowie der offiziellen Logos ist nicht durch die Code- oder ORC-Lizenz eingeräumt. Zulässige sachliche Herkunfts- und Kompatibilitätsangaben bleiben unberührt.

Vor kommerzieller Veröffentlichung sind Herkunft, Nutzungsrechte, Attribution, Lizenzkompatibilität und die Rechte an bisherigen Beiträgen zu überprüfen. Diese Dokumentation ersetzt keine rechtliche Prüfung.
