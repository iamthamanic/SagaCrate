/**
 * ArchetypeIcon — Lucide icon for each SagaTree primary archetype option.
 * Location: src/app/character/creation/ArchetypeIcon.tsx
 */
import {
  Brain,
  Handshake,
  HeartPulse,
  Swords,
  VenetianMask,
  type LucideIcon,
} from 'lucide-react';
import type { SagaTreeArchetypeKey } from '../../../domains/rules/sagatree/character-creation';

const ARCHETYPE_ICONS: Record<SagaTreeArchetypeKey, LucideIcon> = {
  fighter: Swords,
  thinker: Brain,
  healer: HeartPulse,
  rebel: VenetianMask,
  diplomat: Handshake,
};

type ArchetypeIconProps = {
  archetypeKey: SagaTreeArchetypeKey;
  className?: string;
};

export function ArchetypeIcon({ archetypeKey, className = 'h-4 w-4' }: ArchetypeIconProps) {
  const Icon = ARCHETYPE_ICONS[archetypeKey];
  return <Icon className={className} aria-hidden="true" />;
}
