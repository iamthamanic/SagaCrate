/**
 * useSagaEnsembleProfiles — Enrich saga-hub ensemble with account + character avatars.
 * Account via userProfileService; character via roster meta + native pregen fallback.
 * Location: src/app/project/hooks/useSagaEnsembleProfiles.ts
 */
import { useEffect, useRef, useState } from 'react';
import type { SagaEnsembleMemberVm } from '../../../domains/project/contracts/saga-overview';
import {
  resolveEnsembleCharacterIdentity,
  type EnsembleCharacterIdentityVm,
} from '../../../domains/character/use-cases/ensemble-character-identity';
import { resolveGmDefaultPortraitUrl } from '../../../domains/character/use-cases/sagatree-native-gm-presence';
import { sagatreeNativePregenPortraitUrlByName } from '../../../domains/character/use-cases/sagatree-native-pregen-portraits';
import { resolveAccountDisplayName } from '../../../domains/user-profile';
import { characterService } from '../../../infrastructure/character/character-service';
import { userProfileService } from '../../../infrastructure/user-profile/user-profile-service';

export type SagaEnsembleMemberWithAccount = SagaEnsembleMemberVm & {
  readonly accountDisplayName: string;
  readonly avatarUrl: string | null;
  readonly characterPortraitUrl: string | null;
  readonly identity: EnsembleCharacterIdentityVm | null;
};

function rosterKey(members: readonly SagaEnsembleMemberVm[]): string {
  return members
    .map((m) => `${m.userId}:${m.role}:${m.characterId ?? ''}:${m.characterName ?? ''}`)
    .join('|');
}

function isGmRole(role: string): boolean {
  return role === 'gamemaster' || role === 'gm';
}

function resolveCharacterPortrait(
  characterName: string | null | undefined,
  isGamemaster: boolean,
  fromRoster: string | null = null,
): string | null {
  if (fromRoster) return fromRoster;
  const native = characterName?.trim()
    ? sagatreeNativePregenPortraitUrlByName(characterName)
    : null;
  if (native) return native;
  return resolveGmDefaultPortraitUrl({
    isGamemaster,
    characterName,
  });
}

function toBase(members: readonly SagaEnsembleMemberVm[]): SagaEnsembleMemberWithAccount[] {
  return members.map((m) => ({
    ...m,
    accountDisplayName: 'Account',
    avatarUrl: null,
    characterPortraitUrl: resolveCharacterPortrait(
      m.characterName,
      isGmRole(String(m.role)),
    ),
    identity: resolveEnsembleCharacterIdentity({ characterName: m.characterName }),
  }));
}

export function useSagaEnsembleProfiles(
  ensemble: readonly SagaEnsembleMemberVm[],
): readonly SagaEnsembleMemberWithAccount[] {
  const key = rosterKey(ensemble);
  const snapshotRef = useRef(ensemble);
  snapshotRef.current = ensemble;

  const [members, setMembers] = useState<SagaEnsembleMemberWithAccount[]>(() =>
    toBase(ensemble),
  );

  useEffect(() => {
    let cancelled = false;
    const snapshot = snapshotRef.current.map((m) => ({ ...m }));

    setMembers(toBase(snapshot));
    if (snapshot.length === 0) return;

    void (async () => {
      const accountMeta = new Map<string, { displayName: string; avatarUrl: string | null }>();
      try {
        const profiles = await userProfileService.getProfilesByUserIds(
          [...new Set(snapshot.map((m) => m.userId))],
        );
        for (const row of profiles) {
          const label =
            resolveAccountDisplayName({
              profileDisplayName: row.displayName,
              email: null,
            }) ?? 'Account';
          accountMeta.set(row.id, {
            displayName: label,
            avatarUrl: row.avatarUrl,
          });
        }
      } catch (err) {
        console.error('Saga hub ensemble profile batch failed:', err);
      }

      const characterMetaById = new Map<
        string,
        Awaited<ReturnType<typeof characterService.getCharacterRosterMetaByIds>>[number]
      >();
      const characterIds = [
        ...new Set(
          snapshot
            .map((m) => m.characterId)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        ),
      ];
      if (characterIds.length > 0) {
        try {
          const rows = await characterService.getCharacterRosterMetaByIds(characterIds);
          for (const row of rows) {
            characterMetaById.set(row.id, row);
          }
        } catch (err) {
          console.error('Saga hub ensemble character portrait batch failed:', err);
        }
      }

      if (cancelled) return;

      setMembers(
        snapshot.map((m) => {
          const account = accountMeta.get(m.userId);
          const rosterRow =
            m.characterId && characterMetaById.has(m.characterId)
              ? characterMetaById.get(m.characterId) ?? null
              : null;
          return {
            ...m,
            accountDisplayName: account?.displayName ?? 'Account',
            avatarUrl: account?.avatarUrl ?? null,
            characterPortraitUrl: resolveCharacterPortrait(
              m.characterName,
              isGmRole(String(m.role)),
              rosterRow?.portraitUrl ?? null,
            ),
            identity: resolveEnsembleCharacterIdentity({
              characterName: m.characterName,
              fromRoster: rosterRow,
            }),
          };
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [key]);

  return members;
}
