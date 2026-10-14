/**
 * character domain — public API for character domain layer.
 * Location: src/domains/character/index.ts
 */
export * from './domain/character.entity';
export * from './domain/sagatree-profile.entity';
export * from './contracts/character.commands';
export * from './contracts/character.views';
export * from './use-cases/normalize-character';
export * from './use-cases/assert-character-persistence';
export * from './use-cases/dornhain-pregen-sheets';
export * from './contracts/character-preset.types';
export * from './contracts/character-adventure-arc.types';
export * from './contracts/character-lore.types';
export * from './use-cases/character-lore-traits';
export * from './use-cases/character-lore-examples';
export * from './use-cases/avatar-presets';
export * from './use-cases/genderReading';
export * from './avatar';
