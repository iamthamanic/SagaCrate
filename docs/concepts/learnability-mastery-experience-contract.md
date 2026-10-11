# SagaTree — Learnability & Mastery Experience Contract

> **Stand:** 11.10.2026 · **Status:** Vorschlag zur Referenzierung; noch nicht in AGENTS.md aktiviert.
>
> **Easy to Start. Natural to Learn. Deep to Master.**
>
> Jeder kann SagaTree sofort benutzen. Niemand muss alles verstehen. Wer mehr erschaffen will, stößt nicht an künstliche Grenzen.

## 1. Ziel

SagaTree soll als Virtual Tabletop, Live-Improvisations- und Actual-Play-Plattform einen extrem einfachen Einstieg bieten, ohne seine kreative Tiefe zu verlieren. **Schwierig dürfen Geschichten, Strategie, Weltgestaltung und kreative Entscheidungen sein — nicht die Bedienung der Software.**

Für einen Spieler bedeutet das: Link öffnen, Figur wählen, mitspielen. Für einen neuen Game Master: Mit einer spielbaren Szene beginnen, Menschen einladen und improvisieren. Für fortgeschrittene GMs und Creator: Regelwerke, Simulation, Welten, LiveAct, Director, eigene Szenen und Automationen bei Bedarf hinzunehmen.

**Nicht-Ziele:** künstlich gesperrte Expertenfunktionen, Zwangstutorials, separate inkompatible Anfänger-Datenmodelle, Feature-Wildwuchs im Standard-Interface, neue Onboarding-Frameworks ohne nachgewiesenen Bedarf.

## 2. Das Grundprinzip

**Low Floor · High Ceiling · Wide Walls** (Resnick/Silverman):

- **Low Floor:** Erste sinnvolle Handlung ohne Produktvorwissen, mit guten Defaults und Vorlagen.
- **High Ceiling:** Sehr tiefe, erweiterbare Regeln, Welten, Werkzeuge, Regie- und Produktionsmöglichkeiten.
- **Wide Walls:** Unterschiedliche Wege: nur spielen, Kampagnen leiten, Welten bauen oder eigene Shows produzieren.

**Produktive Komplexität** schafft neue kreative Möglichkeiten. **Vermeidbare Komplexität** entsteht durch schwer nachvollziehbare Begriffe, unnötige Konfigurationsschritte, unklare Zustände und zu viele Klicks. Die zweite Kategorie wird systematisch reduziert.

## 3. Wissenschaftliche Grundlagen

| Forschung/Heuristik | Aussage und Transfer | Einschränkung |
| --- | --- | --- |
| Progressive Disclosure | Spezialoptionen kontextabhängig und auffindbar statt gleichzeitig präsentieren. | UX-Heuristik, keine Garantie für Conversion. |
| Cognitive Load Theory (Sweller) | Begrenztes Arbeitsgedächtnis; unnötige Entscheidungen/Erklärungen verringern. | Übertragung aus Lernforschung auf VTT ist eine Produkthypothese. |
| Expertise Reversal Effect (Kalyuga et al.) | Anfängerhilfen können Experten behindern; Shortcuts und überspringbare Hinweise vorsehen. | Abhängig von Aufgabe und Vorwissen. |
| Flow / Challenge–Skill (Fong et al.) | Sinnvolle Balance zwischen Herausforderung und Fähigkeit fördert Flow; klare Ziele und Kontrolle helfen. | Moderater Zusammenhang, nicht allein ursächlich. |
| Self-Determination Theory (Ryan et al.) | Autonomie, Kompetenz und soziale Eingebundenheit sind für motivierendes Spielen relevant. | Kein Nachweis für eine konkrete SagaTree-Oberfläche. |
| Low Floor / High Ceiling / Wide Walls | Kreative Systeme sollen leicht zu betreten, tief und vielseitig sein. | Designprinzip, keine quantitative Erfolgsmetrik. |

Primärquellen in Abschnitt 11.

## 4. Beziehung zu vorhandenen Verträgen

Dieser Vertrag **ergänzt** drei bestehende kanonische Dateien:

- [Conductor Experience](./conductor-experience-contract.md), **CE-***: Bühnen-Permanenz, Kontext statt Navigation, höchstens 2 Interaktionen nach Zielauswahl oder 3 aus neutralem Live-Zustand, lokales Feedback <=100 ms p95, Undo, Mastery Layer.
- [Adaptive UI](./adaptive-ui-experience-contract.md), **AU-***: unterschiedliche Rollen/Geräte, Touch, Tastatur, A11y und sinnvolle Layout-Rekomposition.
- [Imagination First](./imagination-first-visualization-contract.md), **IV-***: fiktionale und visuelle Details nur schrittweise konkretisieren.

**LM-*** ergänzt den bislang nicht systematisch geregelten Weg **vom ersten sinnvollen Erfolg zur freiwilligen Expertennutzung**. Bestehende Sicherheits-, Rollen- und UX-Gates gelten weiterhin. Die hier vorgeschlagenen LM-Gates werden erst durch separate Integration in AGENTS.md/Acceptance verbindlich.

## 5. Verbindliche Produktabsicht

### Handlung vor Konfiguration
Frage zuerst „Was möchtest du jetzt tun?“ und erst danach nach Details. Eine Standard-Spielsession benötigt keine vorherige Beschäftigung mit Regelwerks-, Welt- oder Director-Konfiguration, soweit dies technisch vermeidbar ist. Notwendige Saga-/Session-Daten dürfen durch einen sicheren, idempotenten Quick Start erzeugt werden.

### Progressive Disclosure ohne Feature-Sperren
Eine dominierende nächste Aktion pro Kontext. Fortgeschrittene Werkzeuge sind sinnvoll gruppiert, klar beschriftet, dauerhaft auffindbar und sofort für **berechtigte** Nutzer erreichbar. Kein künstliches Freischalten durch Nutzungstage oder Stufen. Häufige Aktionen werden nicht aus minimalistischen Motiven versteckt.

### Im Kontext lernen
Kleine Hinweise und konkrete Beispiele statt Pflichtproduktführung. Hilfen sind überspringbar, wiederaufrufbar und abschaltbar. „NPC in die Szene bringen“ demonstriert eine reale Handlung; lange Erklärungen über interne Datenmodelle sind ungeeignet.

### Experte wird schneller, nicht anders
Tastaturbefehle und Command-Palette beschleunigen dieselben Aktionen und respektieren CE-16. Kein paralleles Experten-Backend. Der Anfängerweg bleibt immer verständlich.

### Tiefe ohne Datenverlust
Ein Quick-Start-Charakter bleibt editierbar, die gestartete Saga ausbaubar und alle regulären Spielstände erhalten. Spätere Erweiterungen dürfen keinen Neustart verlangen oder bereits vorhandene Fakten stillschweigend überschreiben.

### Live-Spiel nicht unterbrechen
Bühne bleibt sichtbar (CE-01); Kontext statt Verwaltungsseiten (CE-02); CE-03-Bedienbudget einhalten. Aktionen erhalten sofortige erkennbare Rückmeldung und sichere Änderungen sind leicht rückgängig zu machen.

### Medien und Performance optional
Kamera, Mikrofon, LiveAct, Director und aufwendiges 3D sind nur dann zwingend, wenn die bewusst gewählte Aufgabe sie benötigt. Zugriffe auf Geräte nur nach ausdrücklicher Nutzeraktion. Degraded Fallbacks ermöglichen gewöhnliches Spiel auch bei fehlenden Medienfähigkeiten.

### Rollentrennung
Spieler, GM, Viewer und Director besitzen unterschiedliche Arbeitskontexte. Sichtbare Controls oder erweiterte Modi gewähren **niemals** zusätzliche Serverberechtigungen: Membership, RLS und Autorisierung bleiben maßgeblich.

## 6. Vorgeschlagene LM-Gates

| Gate | Muss-/Soll-Regel | Test |
| --- | --- | --- |
| **LM-01 First Value** | Erste sinnvolle Handlung ohne Pflicht-Tutorial möglich. | Erstnutzer-Aufgabe |
| **LM-02 Minimal Setup** | Standard-Session ohne vermeidbare Vorabkonfiguration. | E2E + Usability |
| **LM-03 Clear Next Action** | Pro Einstiegskontext eindeutiger nächster Schritt. | Findability |
| **LM-04 Discoverable Depth** | Tiefe ist auf Anfrage auffindbar, nicht verborgen oder gesperrt. | Expertentask |
| **LM-05 Contextual Help** | Hilfe relevant, überspringbar und wiederaufrufbar. | UI-Test |
| **LM-06 Growth without Loss** | Quick-Start-Daten später vollständig weiterverwendbar. | Integration + Reload |
| **LM-07 AuthZ Separation** | Lern-/Sichtbarkeitszustand gewährt keine Rechte. | Security |
| **LM-08 Expert Access** | Experten können Hilfen umgehen und Tools direkt nutzen. | Expertentask |
| **LM-09 Graceful Media** | Optionales Media-/LiveAct-Problem blockiert Grundspiel nicht. | Degraded E2E |
| **LM-10 Human Validation** | Erster Kernablauf mit echten unvorbereiteten Nutzern geprüft. | Usability-Protokoll |
| **LM-11 Expert Efficiency** | Wiederkehrende Aktionen per Shortcut/Palette schneller möglich. | Zeitvergleich |
| **LM-12 Guidance Restraint** | Hinweise unterbrechen keine Live-Performance. | Beobachtung |
| **LM-13 Terminology** | Welt, Saga, Spielgruppe, Session, Figur und Director klar unterschieden. | Verständnistest |
| **LM-14 No Rework** | Spätere Erweiterung verlangt keine redundante Neuerfassung. | Integration |
| **LM-15 Measured Friction** | Erfolgsrate, Task-Zeit, Abbrüche und SEQ dokumentiert. | UX-Benchmark |
| **LM-16 A11y Parity** | Auch reduzierte und Experten-UI erfüllt AU/CE-Gates. | A11y + E2E |

Die Gates sind **Designvorschläge**, noch keine CI-Erfolgsbehauptungen.

## 7. Kern-Journeys

**Spieler:** Einladungslink → Session erkennen → eigenen Charakter oder spielbare Vorlage wählen → optionale Medienfreigaben → mitspielen und erste Aktion ausführen. Kein vorheriges Lernen von Weltprofilen oder Datenmodell.

**GM-Neuling:** „Session starten“ → Vorlage oder leere spielbare Bühne → benötigte Grunddaten transparent erstellen → Link teilen → ersten NPC oder ersten Wurf nutzen. Welt- und Rule-Builder erst später.

**Erfahrener GM:** Letzte Session fortsetzen → Szenen, NPCs, Gegenstände und Wissen im Kontext verwalten → Bühne bleibt bestehen, kein wiederholtes Tutorial.

**Actual-Play-Creator:** Grundlegende Spielsession verwenden → Program/Director optional hinzunehmen → Standard-Layout starten → Kameraquellen, Cues, LiveAct und Branding vertiefen. Eine normale Spielrunde bleibt von Produktionswerkzeugen unbelastet.

## 8. Codebase-Audit (11.10.2026, GitHub-Dateien)

| Datei/Bereich | Bereits vorhanden | Offene UX-Hypothese |
| --- | --- | --- |
| `docs/concepts/conductor-experience-contract.md` | CE-Messregeln, Stage Permanence, Mastery Layer. | Fokus auf Live-Aktion statt vollständiger Erstnutzerreise. |
| `docs/concepts/adaptive-ui-experience-contract.md` | Geräte- und Eingabekonzepte. | Responsive heißt noch nicht leicht erlernbar. |
| `docs/concepts/imagination-first-visualization-contract.md` | Progressive Visualisierung. | Kein allgemeines Feature-Lernmodell. |
| `src/app/dashboard/Dashboard.tsx` | Vier große Einstiegshandlungen. | Vier gleichrangige Optionen ohne klare Erstnutzer-Empfehlung. |
| `src/app/character/creation/CreateCharacterEntryDialog.tsx` | Leer starten oder Vorlagen wählen. | Schnell spielbare Vorlage könnte stärker priorisiert werden. |
| `src/app/character/creation/StartingTemplatePicker.tsx` | Zehn Level-1-Vorlagen mit Hilfe. | Verständlichkeit der Wahl testen. |
| `src/app/session/SessionJoin.tsx` | Host/Join und automatische Sessionnamen. | GM ohne Saga muss zuerst separat eine Saga anlegen. |
| `src/app/session/SessionLobbyScreen.tsx` | Ready, optional Kamera/Mikrofon/LiveAct. | Drei getrennte Prüfungen könnten Einsteiger überladen. |
| `src/app/session/GamemasterLiveScreen.tsx` | Mehrere GM-Kontexte. | Live-Routineaktionen auf Klicktiefe/Begriffe prüfen. |
| `e2e/golden-mobile-journeys.spec.ts` | Technische Golden Journeys. | Misst nicht selbstständiges Verstehen. |

**Grenze:** Nur lesende Repository-Prüfung; kein aktueller Live-App-Test und keine Usability-Befragung. Die genannten Lücken sind zu verifizierende Hypothesen.

## 9. Messung und Zielwerte

Die folgenden Zahlen sind **vorläufige Produktziele**, nicht aus wissenschaftlichen Studien abgeleitete Grenzwerte:

| Nutzertask | Ziel | Nachweis |
| --- | --- | --- |
| Spieler tritt per gültigem Link bei | Median <2 Minuten | Task vom Link bis spielbereit |
| Neuer GM eröffnet eine spielbare Szene | <5 Minuten, ohne fremde Hilfe | Erstnutzer-Test |
| Erster Würfelwurf | Ohne gesprochene Anleitung auffindbar | Unassisted Completion |
| NPC spontan in Szene | Max. 2 Schritte nach Zielwahl (CE-03) | Click-/Keyboard-Trace |
| Fortgeschrittene Funktion finden | Ohne Datenmodell-Erklärung | Findability |
| Subjektive Einfachheit | Exploratives Ziel SEQ >=6/7 | Single Ease Question nach Aufgabe |
| Expertenroutine | Keine Verlangsamung durch Einstiegshilfen | Vorher-/Nachher-Vergleich |

Neue Spieler, neue GMs, erfahrene GMs und Creator getrennt untersuchen. Zusätzlich Gerät, VTT-Vorerfahrung, Task-Erfolg, Fehlversuche, Abbrüche und Ursachen erfassen. Playwright kann Bedienbarkeit technisch prüfen, **nicht** subjektive Erlernbarkeit. Experimente datensparsam durchführen.

## 10. Implementierungsentscheidung

**A — YAGNI:** Nur den bestehenden CE-Vertrag verwenden. Minimal, aber ohne explizite First-Value-/Learnability-Gates.

**B — LM-Vertrag plus kleine vertikale Verbesserungen (empfohlen):** Bestehende UI-Primitives weiterverwenden, neue Gates bei relevanten Tickets einsetzen; kein zusätzliches Framework. Schrittfolge:

1. Nach separater Freigabe Referenz in `AGENTS.md` verankern.
2. `Dashboard.tsx`/`SessionJoin.tsx`: GM-Quick-Start ohne unnötige Saga-Vorarbeit.
3. `CreateCharacterEntryDialog.tsx`/`StartingTemplatePicker.tsx`/`SessionLobbyScreen.tsx`: Einstieg nach echten Nutzerbeobachtungen vereinfachen.
4. `GamemasterLiveScreen.tsx`: Kontextsteuerung und CE-03 prüfen.
5. Technische Golden Journeys und menschliche UX-Tests erweitern.
6. Weitere Hilfesysteme **nur bei gemessenem Bedarf** einführen.

**C — Zentrale adaptive Learning-Engine:** Personalisierte Feature-Empfehlung anhand des Verhaltens. Nicht für den ersten Markteintritt erforderlich; mehr Datenschutz-, State- und Wartungsaufwand.

Architekturgrenzen: `src/app/**` für Journeys, `src/domains/**` für reine Fachlogik, `src/infrastructure/**` für Backend-Adapter, `src/shared/ui/**` für generische UI. Keine neuen `src/components/**` oder `src/modules/**`.

## 11. Forschung, Methodik und Referenzen

1. Resnick, M. & Silverman, B. (2005). *Some Reflections on Designing Construction Kits for Kids.* DOI: https://doi.org/10.1145/1109540.1109556
2. Sweller, J. (1988). *Cognitive Load During Problem Solving: Effects on Learning.* DOI: https://doi.org/10.1207/s15516709cog1202_4
3. Kalyuga, S., Ayres, P., Chandler, P. & Sweller, J. (2003). *The Expertise Reversal Effect.* DOI: https://doi.org/10.1207/S15326985EP3801_4
4. Fong, C. J., Zaleski, D. J. & Leach, J. K. (2015). *The Challenge–Skill Balance and Antecedents of Flow: A Meta-Analytic Investigation.* DOI: https://doi.org/10.1080/17439760.2014.967799
5. Ryan, R. M., Rigby, C. S. & Przybylski, A. K. (2006). *The Motivational Pull of Video Games: A Self-Determination Theory Approach.* DOI: https://doi.org/10.1007/s11031-006-9051-8
6. Nielsen Norman Group. *Progressive Disclosure.* https://www.nngroup.com/articles/progressive-disclosure/
7. MeasuringU. *10 Things to Know About the Single Ease Question.* https://measuringu.com/seq10/
8. MeasuringU. *The Evolution of the Single Ease Question.* https://measuringu.com/evolution-of-seq/

### Direkt verwendbarer Ticket-Verweis

> Beachte `docs/concepts/learnability-mastery-experience-contract.md` zusammen mit `CE-*`, `AU-*` und ggf. `IV-*`. Bestimme erste erfolgreiche Nutzerhandlung, vermeidbare Voraussetzungen, Kontext-Hilfe, Auffindbarkeit fortgeschrittener Optionen, Experteneffizienz, betroffene `LM-*`-Gates und messbare Akzeptanztests.

---

**SagaTree verspricht nicht, dass jedes Feature simpel ist. SagaTree verspricht, dass der Weg zum nächsten sinnvollen Erfolg simpel bleibt.**
