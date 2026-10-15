/**
 * Supabase adapter for user_profiles + user-avatars storage (#682).
 * Location: src/infrastructure/user-profile/supabase-user-profile.repository.ts
 */
import { supabase } from '../../lib/supabase';
import { getAuthenticatedUserId } from '../../lib/authenticatedUser';
import type { UserProfileVm } from '../../domains/user-profile';

const USER_AVATARS_BUCKET = 'user-avatars';
/** 7 days — refreshed on each batch/profile load for lobby stability. */
const USER_AVATAR_SIGNED_SECONDS = 60 * 60 * 24 * 7;
const USER_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const USER_AVATAR_MIME_EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const;

type UserAvatarMime = keyof typeof USER_AVATAR_MIME_EXTENSIONS;

type UserProfileRow = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
  updated_at: string | null;
};

async function sniffUserAvatarMime(file: File): Promise<UserAvatarMime | null> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return 'image/png';
  }
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

async function signedUrlForPath(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(USER_AVATARS_BUCKET)
    .createSignedUrl(path, USER_AVATAR_SIGNED_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function mapRow(row: UserProfileRow, avatarUrl: string | null): UserProfileVm {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    avatarUrl,
    updatedAt: row.updated_at,
  };
}

function formatSupabaseError(error: { message?: string; code?: string; details?: string } | null): string {
  if (!error) return 'unbekannter Fehler';
  const parts = [error.message, error.code ? `[${error.code}]` : null, error.details]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts.join(' ') : 'unbekannter Fehler';
}

class SupabaseUserProfileRepository {
  /**
   * Ensure a row exists for the signed-in user. Select-then-insert avoids
   * upsert edge cases; duplicate insert (race) is treated as success.
   */
  async ensureOwnProfileRow(): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const { data, error: selectError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (selectError) {
      throw new Error(`Profil konnte nicht geladen werden: ${formatSupabaseError(selectError)}`);
    }
    if (data) return;

    const { error: insertError } = await supabase.from('user_profiles').insert({ id: userId });
    if (!insertError) return;
    // Concurrent ensure / signup trigger already created the row.
    if (insertError.code === '23505') return;
    throw new Error(`Profil konnte nicht angelegt werden: ${formatSupabaseError(insertError)}`);
  }

  async getOwnProfile(): Promise<UserProfileVm | null> {
    const userId = await getAuthenticatedUserId();
    await this.ensureOwnProfileRow();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_path, updated_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      throw new Error(`Profil konnte nicht geladen werden: ${formatSupabaseError(error)}`);
    }
    if (!data) return null;
    const row = data as UserProfileRow;
    const avatarUrl = await signedUrlForPath(row.avatar_path);
    return mapRow(row, avatarUrl);
  }

  /**
   * Batch load for lobby — one query + parallel signed URLs.
   * Missing rows are omitted (caller applies display fallback).
   */
  async getProfilesByUserIds(userIds: readonly string[]): Promise<UserProfileVm[]> {
    const ids = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_path, updated_at')
      .in('id', ids);
    if (error) {
      throw new Error(`Profile konnten nicht geladen werden: ${formatSupabaseError(error)}`);
    }
    const rows = (data ?? []) as UserProfileRow[];
    const mapped = await Promise.all(
      rows.map(async (row) => mapRow(row, await signedUrlForPath(row.avatar_path))),
    );
    return mapped;
  }

  async uploadAvatar(file: File): Promise<UserProfileVm> {
    const userId = await getAuthenticatedUserId();
    await this.ensureOwnProfileRow();

    const sniffed = await sniffUserAvatarMime(file);
    if (!sniffed) {
      throw new Error('Ungültiger Dateityp. Nur PNG, JPEG und WEBP sind erlaubt.');
    }
    if (file.type && file.type !== sniffed) {
      throw new Error('Deklarierter Bildtyp stimmt nicht mit dem Dateiinhalt überein.');
    }
    if (file.size > USER_AVATAR_MAX_BYTES) {
      throw new Error('Datei zu groß. Maximum ist 5MB.');
    }

    const extension = USER_AVATAR_MIME_EXTENSIONS[sniffed];
    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(USER_AVATARS_BUCKET)
      .upload(filePath, file, {
        contentType: sniffed,
        upsert: false,
      });
    if (uploadError) {
      throw new Error(`Avatar-Upload fehlgeschlagen: ${formatSupabaseError(uploadError)}`);
    }

    const { data: previous } = await supabase
      .from('user_profiles')
      .select('avatar_path')
      .eq('id', userId)
      .maybeSingle();
    const previousPath =
      previous && typeof (previous as { avatar_path?: unknown }).avatar_path === 'string'
        ? (previous as { avatar_path: string }).avatar_path
        : null;

    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_path: filePath })
      .eq('id', userId)
      .select('id, display_name, avatar_path, updated_at')
      .single();
    if (updateError || !updated) {
      // Best-effort cleanup of orphan object; keep prior avatar_path on row.
      await supabase.storage.from(USER_AVATARS_BUCKET).remove([filePath]);
      throw new Error(
        updateError
          ? `Avatar konnte nicht gespeichert werden: ${formatSupabaseError(updateError)}`
          : 'Avatar konnte nicht gespeichert werden',
      );
    }

    if (previousPath && previousPath !== filePath) {
      void supabase.storage.from(USER_AVATARS_BUCKET).remove([previousPath]);
    }

    const row = updated as UserProfileRow;
    const avatarUrl = await signedUrlForPath(row.avatar_path);
    return mapRow(row, avatarUrl);
  }
}

export const supabaseUserProfileRepository = new SupabaseUserProfileRepository();
