/**
 * StartingTemplateIcon — Lucide icon per SagaTree Level-1 starttemplate key.
 * Location: src/app/character/creation/StartingTemplateIcon.tsx
 */
import {
  Axe,
  Brain,
  Cpu,
  Crosshair,
  Eye,
  HeartPulse,
  Megaphone,
  Sparkles,
  VenetianMask,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { SagaTreeStartingTemplateKey } from '../../../domains/rules/sagatree/starting-templates';

const STARTING_TEMPLATE_ICONS: Record<SagaTreeStartingTemplateKey, LucideIcon> = {
  berserker: Axe,
  vanguard: Crosshair,
  mage: Sparkles,
  technomancer: Cpu,
  medicus: HeartPulse,
  mystic: Eye,
  assassin: VenetianMask,
  mechanom: Wrench,
  mentalist: Brain,
  herald: Megaphone,
};

type StartingTemplateIconProps = {
  templateKey: SagaTreeStartingTemplateKey;
  className?: string;
};

export function StartingTemplateIcon({
  templateKey,
  className = 'h-4 w-4',
}: StartingTemplateIconProps) {
  const Icon = STARTING_TEMPLATE_ICONS[templateKey];
  return <Icon className={className} aria-hidden="true" />;
}
