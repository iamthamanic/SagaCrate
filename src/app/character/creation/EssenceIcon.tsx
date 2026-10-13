/**
 * EssenceIcon — Lucide icon for each SagaTree primary essence option.
 * Location: src/app/character/creation/EssenceIcon.tsx
 */
import {
  Brain,
  CircuitBoard,
  Ghost,
  Link2,
  PersonStanding,
  type LucideIcon,
} from 'lucide-react';
import type { SagaTreeEssenceKey } from '../../../domains/rules/sagatree/character-creation';

const ESSENCE_ICONS: Record<SagaTreeEssenceKey, LucideIcon> = {
  physical: PersonStanding,
  mental: Brain,
  spiritual: Ghost,
  bound: Link2,
  technological: CircuitBoard,
};

type EssenceIconProps = {
  essenceKey: SagaTreeEssenceKey;
  className?: string;
};

export function EssenceIcon({ essenceKey, className = 'h-4 w-4' }: EssenceIconProps) {
  const Icon = ESSENCE_ICONS[essenceKey];
  return <Icon className={className} aria-hidden="true" />;
}
