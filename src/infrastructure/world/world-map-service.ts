/**
 * world-map-service — Supabase adapter for world_maps (#580).
 * Location: src/infrastructure/world/world-map-service.ts
 */
import { supabase } from '../../lib/supabase';
import {
  parseWorldMapVm,
  type WorldMapData,
  type WorldMapVm,
} from '../../domains/world/map';

class WorldMapService {
  async getMap(worldProfileId: string, playerView = false): Promise<WorldMapVm> {
    const id = worldProfileId.trim();
    if (!id) throw new Error('Weltprofil fehlt');
    const { data, error } = await supabase.rpc('get_world_map', {
      p_world_profile_id: id,
      p_player_view: playerView,
    });
    if (error) throw new Error(`Karte konnte nicht geladen werden: ${error.message}`);
    const vm = parseWorldMapVm(data);
    if (!vm) throw new Error('Ungültige Kartenantwort');
    return vm;
  }

  async saveMap(
    worldProfileId: string,
    expectedRevision: number,
    mapData: WorldMapData,
  ): Promise<WorldMapVm> {
    const id = worldProfileId.trim();
    if (!id) throw new Error('Weltprofil fehlt');
    const { data, error } = await supabase.rpc('save_world_map', {
      p_world_profile_id: id,
      p_expected_revision: expectedRevision,
      p_map_data: mapData,
    });
    if (error) throw new Error(`Karte konnte nicht gespeichert werden: ${error.message}`);
    const vm = parseWorldMapVm(data);
    if (!vm) throw new Error('Ungültige Speicherantwort');
    return vm;
  }

  /** Upload pin image; returns Storage path (not signed URL). */
  async uploadPinImage(
    worldProfileId: string,
    file: File,
  ): Promise<string> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Anmeldung erforderlich');
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${user.id}/world/${worldProfileId}/pins/${Date.now().toString(36)}.${ext}`;
    const { error } = await supabase.storage.from('world-map-pins').upload(path, file, {
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });
    if (error) throw new Error(`Pin-Bild Upload fehlgeschlagen: ${error.message}`);
    return path;
  }
}

export const worldMapService = new WorldMapService();
