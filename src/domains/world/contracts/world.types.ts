export type WorldModuleConfig = Record<string, unknown>;
export type WorldModuleConfigMap = Record<string, WorldModuleConfig>;

export interface WorldProfileDto {
  id: string;
  owner_user_id: string;
  public_id: string;
  name: string;
  description: string | null;
  modules: unknown;
  created_at: string;
  updated_at: string;
}

export interface WorldProfileVm {
  id: string;
  /** Immutable public world id (WO-XXXXX). */
  publicId: string;
  name: string;
  description: string;
  modules: WorldModuleConfigMap;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorldProfileDto {
  name: string;
  description?: string;
  modules?: WorldModuleConfigMap;
}

export interface UpdateWorldProfileDto {
  name?: string;
  description?: string;
  modules?: WorldModuleConfigMap;
}
