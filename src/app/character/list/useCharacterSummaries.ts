/**
 * Cached character summaries for Bibliothek/Dashboard list views.
 * Location: src/app/character/list/useCharacterSummaries.ts
 *
 * Excludes GM presence rows (character_type=gm_presence / Weltgeist) — not playable PCs.
 */

import { useCallback, useMemo } from 'react';
import { ENTITY_CACHE_KEYS, entityCache } from '../../../lib/entityCache';
import { useCachedEntityList } from '../../../lib/useCachedEntityList';
import { characterService } from '../../../infrastructure/character/character-service';
import type { CharacterSummaryVm } from '../../../domains/character';
import { isGmPresenceCharacterSummary } from '../../../domains/character/use-cases/sagatree-native-gm-presence';

interface UseCharacterSummariesOptions {
  enabled?: boolean;
}

export function useCharacterSummaries(options: UseCharacterSummariesOptions = {}) {
  const { enabled = true } = options;

  const fetcher = useCallback(() => characterService.getUserCharacterSummaries(), []);

  const { items, isLoading, error, refresh } = useCachedEntityList<CharacterSummaryVm[]>(
    ENTITY_CACHE_KEYS.characterSummaries,
    fetcher,
    [],
    { enabled },
  );

  const playableCharacters = useMemo(
    () => items.filter((char) => !isGmPresenceCharacterSummary(char)),
    [items],
  );

  const deleteCharacter = useCallback(async (id: string): Promise<boolean> => {
    try {
      await characterService.deleteCharacter(id);
      entityCache.invalidate(ENTITY_CACHE_KEYS.characterSummaries);
      await refresh({ force: true });
      return true;
    } catch (err) {
      console.error('Error deleting character:', err);
      return false;
    }
  }, [refresh]);

  const duplicateCharacter = useCallback(async (id: string): Promise<CharacterSummaryVm | null> => {
    try {
      const created = await characterService.duplicateCharacter(id);
      entityCache.invalidate(ENTITY_CACHE_KEYS.characterSummaries);
      await refresh({ force: true });
      return {
        id: created.id,
        publicId: created.publicId,
        name: created.name,
        class: created.class,
        race: created.race,
        level: created.level,
        sheetStatus: created.sheetStatus,
        portraitUrl: created.portraitUrl,
      };
    } catch (err) {
      console.error('Error duplicating character:', err);
      return null;
    }
  }, [refresh]);

  return {
    characters: playableCharacters,
    isLoading,
    error,
    deleteCharacter,
    duplicateCharacter,
    refreshCharacters: refresh,
  };
}
