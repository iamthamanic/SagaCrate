/**
 * SagaWorkspaceCatalogSection — Phase-1 list shells for saga-scoped library filters.
 * Location: src/app/project/SagaWorkspaceCatalogSection.tsx
 *
 * Reuses Library data sources where possible; empty states keep one primary CTA.
 * Full binding/reveal comes in Phase 2; Dornhain seed fill in Phase 3.
 */
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { BookOpen, Loader2, Package, Plus, ScrollText, User, Users } from 'lucide-react';
import { Button } from '../../shared/ui/button';
import { useCharacterSummaries } from '../character';
import { pathForLibraryTab, pathForNpcCreatureCreate, type SagaSectionId } from '../shell';

type SagaWorkspaceCatalogSectionProps = {
  section: Extract<
    SagaSectionId,
    'characters' | 'npc-creatures' | 'items' | 'quests' | 'lore'
  >;
  onNavigate: (view: string) => void;
};

export function SagaWorkspaceCatalogSection({
  section,
  onNavigate,
}: SagaWorkspaceCatalogSectionProps) {
  const charactersEnabled = section === 'characters';
  const { characters, isLoading, error, refreshCharacters } = useCharacterSummaries({
    enabled: charactersEnabled,
  });

  useEffect(() => {
    if (charactersEnabled) {
      void refreshCharacters({ force: true });
    }
  }, [charactersEnabled, refreshCharacters]);

  if (section === 'characters') {
    return (
      <div className="space-y-4" data-saga-catalog="characters">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Spieler-Charaktere dieser Saga (aktuell: deine Library-Charaktere — Saga-Filter folgt
            mit Bindings).
          </p>
          <Button
            type="button"
            className="min-h-11"
            onClick={() => onNavigate('character-editor')}
            data-saga-characters-create
          >
            <Plus className="mr-2 size-4" />
            Neuer Charakter
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Charaktere werden geladen…
          </div>
        ) : null}
        {!isLoading && characters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <User className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Noch keine Spieler-Charaktere.</p>
          </div>
        ) : null}
        <ul className="space-y-2" data-saga-characters-list>
          {characters.map((c) => (
            <li
              key={c.id}
              className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span className="truncate text-sm font-medium">{c.name}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() => onNavigate('character-editor')}
              >
                Öffnen
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          onClick={() => onNavigate(pathForLibraryTab('characters'))}
        >
          In Bibliothek anzeigen
        </Button>
      </div>
    );
  }

  if (section === 'npc-creatures') {
    return (
      <CatalogEmptyShell
        icon={<Users className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />}
        title="NSCs & Kreaturen"
        body="Hier erscheinen die an diese Saga gebundenen NSCs (revealed für die Party). Native Dornhain-Katalog folgt im Seed."
        primaryLabel="NSC erstellen"
        onPrimary={() => onNavigate(pathForNpcCreatureCreate())}
        secondaryLabel="Bibliothek · NSCs"
        onSecondary={() => onNavigate(pathForLibraryTab('npcs'))}
        testId="npc-creatures"
      />
    );
  }

  if (section === 'items') {
    return (
      <CatalogEmptyShell
        icon={<Package className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />}
        title="Gegenstände"
        body="Saga-gebundene Items (Library gefiltert). Anlegen schreibt in die Bibliothek und erscheint hier nach Binding."
        primaryLabel="Bibliothek · Items"
        onPrimary={() => onNavigate(pathForLibraryTab('items'))}
        testId="items"
      />
    );
  }

  if (section === 'quests') {
    return (
      <CatalogEmptyShell
        icon={<ScrollText className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />}
        title="Quests"
        body="Quests dieser Saga. Dornhain-Starter-Quests kommen mit dem Lern-Seed."
        testId="quests"
      />
    );
  }

  return (
    <CatalogEmptyShell
      icon={<BookOpen className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />}
      title="Lore / Verlauf"
      body="Entdeckungen, freigegebenes Wissen und Episoden-Recaps dieser Saga. Session-Reveals und Recaps speisen diese Timeline."
      testId="lore"
    />
  );
}

function CatalogEmptyShell(props: {
  icon: ReactNode;
  title: string;
  body: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testId: string;
}) {
  return (
    <div className="space-y-4" data-saga-catalog={props.testId}>
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        {props.icon}
        <p className="text-sm font-medium text-foreground">{props.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{props.body}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {props.primaryLabel && props.onPrimary ? (
            <Button type="button" className="min-h-11" onClick={props.onPrimary}>
              <Plus className="mr-2 size-4" />
              {props.primaryLabel}
            </Button>
          ) : null}
          {props.secondaryLabel && props.onSecondary ? (
            <Button type="button" variant="outline" className="min-h-11" onClick={props.onSecondary}>
              {props.secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
