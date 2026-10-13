/**
 * SkillProgressionSlotsPanel — Level 3–19 skill-development slot UX (consumer of #90 rules).
 * Location: src/app/character/progression/SkillProgressionSlotsPanel.tsx
 *
 * Incomplete choices live in a local per-level draft state; only complete, domain-valid
 * decisions are propagated via onSkillAdvancesChange/onSpecializationsChange. Every commit
 * is sanitized through the domain so changing an earlier slot prunes dependent later slots.
 */
import { useState } from 'react';
import { Badge } from '../../../shared/ui/badge';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/ui/select';
import {
  getSagaTreeSkill,
  sagaTreeSkillDefinitions,
  type SagaTreeSkillKey,
} from '../../../domains/rules/sagatree/character-creation';
import {
  getSagaTreeSkillAdvanceLevels,
  getSagaTreeSkillCap,
  isValidSkillAdvanceEntry,
  isValidSpecializationForSkillRank,
  resolveSagaTreeSkillRanksSafe,
  sanitizeSagaTreeSkillDevelopment,
  type SagaTreeSkillAdvanceDto,
  type SagaTreeSkillAdvanceLevel,
  type SagaTreeSpecializationRecordDto,
  type SagaTreeStartSkillBuild,
} from '../../../domains/rules/sagatree/skill-progression';
import { RuleHelp } from '../shared/RuleHelp';

type SlotDecisionKind = 'rank-up' | 'learn' | 'specialization' | '';

interface SlotDraft {
  kind: SlotDecisionKind;
  skill?: SagaTreeSkillKey;
  name?: string;
}

interface SkillProgressionSlotsPanelProps {
  characterLevel: number;
  startBuild: SagaTreeStartSkillBuild;
  skillAdvances: SagaTreeSkillAdvanceDto[];
  specializations: SagaTreeSpecializationRecordDto[];
  onSkillAdvancesChange: (advances: SagaTreeSkillAdvanceDto[]) => void;
  onSpecializationsChange: (entries: SagaTreeSpecializationRecordDto[]) => void;
}

function getPersistedSlotDecision(
  level: number,
  advances: readonly SagaTreeSkillAdvanceDto[],
  specializations: readonly SagaTreeSpecializationRecordDto[],
): SlotDraft {
  const advance = advances.find((entry) => entry.level === level);
  if (advance) {
    return { kind: advance.kind, skill: advance.skill };
  }
  const spec = specializations.find((entry) => entry.source === 'skill-development' && entry.acquiredAtLevel === level);
  if (spec) {
    return { kind: 'specialization', skill: spec.skill, name: spec.name };
  }
  return { kind: '' };
}

export function SkillProgressionSlotsPanel({
  characterLevel,
  startBuild,
  skillAdvances,
  specializations,
  onSkillAdvancesChange,
  onSpecializationsChange,
}: SkillProgressionSlotsPanelProps) {
  // Local UI drafts for not-yet-complete decisions; never treated as persisted domain state.
  const [draftsByLevel, setDraftsByLevel] = useState<Partial<Record<number, SlotDraft>>>({});
  const unlockedLevels = getSagaTreeSkillAdvanceLevels(characterLevel);

  const setDraft = (level: number, draft: SlotDraft | undefined) => {
    setDraftsByLevel((current) => {
      const next = { ...current };
      if (draft) next[level] = draft;
      else delete next[level];
      return next;
    });
  };

  /** Commit new development state; domain sanitize prunes dependent invalid later slots. */
  const commitDevelopment = (
    nextAdvances: SagaTreeSkillAdvanceDto[],
    nextSpecializations: SagaTreeSpecializationRecordDto[],
  ) => {
    const sanitized = sanitizeSagaTreeSkillDevelopment(startBuild, nextAdvances, nextSpecializations, characterLevel);
    onSkillAdvancesChange(sanitized.advances);
    onSpecializationsChange(sanitized.specializations);
  };

  const withoutSlot = (level: number) => ({
    advances: skillAdvances.filter((entry) => entry.level !== level),
    specs: specializations.filter(
      (entry) => !(entry.source === 'skill-development' && entry.acquiredAtLevel === level),
    ),
  });

  const ranksBeforeLevel = (level: number, advances: SagaTreeSkillAdvanceDto[]) => {
    const filtered = advances.filter((entry) => entry.level < level);
    return resolveSagaTreeSkillRanksSafe({ ...startBuild, skillAdvances: filtered }, level - 1);
  };

  const clearSlot = (level: number) => {
    setDraft(level, undefined);
    const { advances, specs } = withoutSlot(level);
    commitDevelopment(advances, specs);
  };

  const chooseKind = (level: SagaTreeSkillAdvanceLevel, kind: SlotDecisionKind, persisted: SlotDraft) => {
    if (!kind) {
      clearSlot(level);
      return;
    }
    if (persisted.kind && persisted.kind !== kind) {
      // Kind switch on a persisted decision only drafts the replacement; the persisted
      // decision stays in place until the new choice completes (skill picked for
      // rank-up/learn, name entered for specialization). The completing commit then
      // replaces this level's decision wholesale and sanitize cascades at that point.
      // Skill/name carry over only where meaningful: a specialization draft keeps them
      // (its name input drives the commit), while rank-up/learn complete via the skill
      // select, where a carried-over skill could not be re-picked.
      setDraft(level, kind === 'specialization'
        ? { kind, skill: persisted.skill, name: persisted.name }
        : { kind });
      return;
    }
    setDraft(level, { kind, skill: persisted.skill, name: persisted.name });
  };

  const chooseSkill = (level: SagaTreeSkillAdvanceLevel, skill: SagaTreeSkillKey, decision: SlotDraft) => {
    const kind = decision.kind || 'rank-up';
    if (kind === 'specialization') {
      const trimmedName = decision.name?.trim() ?? '';
      if (!trimmedName) {
        // Specialization stays a draft until a name completes it.
        setDraft(level, { kind, skill, name: decision.name });
        return;
      }
      // A complete (persisted) specialization: changing only the skill commits
      // immediately, replacing this level's specialization so the domain sanitize
      // validates the new decision right away.
      const { advances, specs } = withoutSlot(level);
      const ranks = resolveSagaTreeSkillRanksSafe({ ...startBuild, skillAdvances: advances }, level);
      const existingCount = specs.filter((entry) => entry.skill === skill).length;
      if (!isValidSpecializationForSkillRank(ranks[skill], existingCount)) return;
      commitDevelopment(advances, [
        ...specs,
        { skill, name: trimmedName, source: 'skill-development', acquiredAtLevel: level },
      ]);
      setDraft(level, undefined);
      return;
    }
    const { advances, specs } = withoutSlot(level);
    const candidate: SagaTreeSkillAdvanceDto = { level, kind, skill };
    if (!isValidSkillAdvanceEntry(candidate, ranksBeforeLevel(level, advances))) return;
    commitDevelopment([...advances, candidate], specs);
    setDraft(level, undefined);
  };

  const changeSpecName = (level: SagaTreeSkillAdvanceLevel, decision: SlotDraft, name: string) => {
    if (!decision.skill) return;
    setDraft(level, { kind: 'specialization', skill: decision.skill, name });
    if (!name.trim()) return;
    const { advances, specs } = withoutSlot(level);
    const ranks = resolveSagaTreeSkillRanksSafe({ ...startBuild, skillAdvances: advances }, level);
    const existingCount = specs.filter((entry) => entry.skill === decision.skill).length;
    if (!isValidSpecializationForSkillRank(ranks[decision.skill], existingCount)) return;
    commitDevelopment(advances, [
      ...specs,
      { skill: decision.skill, name: name.trim(), source: 'skill-development', acquiredAtLevel: level },
    ]);
    setDraft(level, undefined);
  };

  if (unlockedLevels.length === 0) return null;

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4" data-testid="skill-progression-slots">
      <div className="flex items-center gap-1">
        <h3 className="font-semibold">Fertigkeitsentwicklung (Level 3–19)</h3>
        <RuleHelp label="Fertigkeitsentwicklung">
          Auf Stufe 3, 5, 7, 9, 11, 13, 15, 17 und 19 wählst du genau eine Entwicklung: bestehenden Skill +1, neuen Skill 0→1 oder eine Spezialisierung.
        </RuleHelp>
      </div>

      <div className="space-y-4">
        {unlockedLevels.map((level) => {
          const persisted = getPersistedSlotDecision(level, skillAdvances, specializations);
          const decision = draftsByLevel[level] ?? persisted;
          const ranksBefore = ranksBeforeLevel(level, skillAdvances);
          const cap = getSagaTreeSkillCap(level);

          return (
            <div key={level} className="space-y-3 rounded-lg border border-border bg-muted/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">Level {level}</Badge>
                <span className="text-xs text-muted-foreground">Cap {cap}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label id={`slot-kind-label-${level}`}>Entwicklung</Label>
                  <Select
                    value={decision.kind || 'unset'}
                    onValueChange={(value) => {
                      chooseKind(level, value === 'unset' ? '' : (value as SlotDecisionKind), persisted);
                    }}
                  >
                    <SelectTrigger className="min-h-11" aria-label={`Level ${level} Entwicklung`}><SelectValue placeholder="Wählen …" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">— zurücksetzen —</SelectItem>
                      <SelectItem value="rank-up">Bestehenden Skill +1</SelectItem>
                      <SelectItem value="learn">Neuen Skill 0→1</SelectItem>
                      <SelectItem value="specialization">Spezialisierung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label id={`slot-skill-label-${level}`}>Fertigkeit</Label>
                  <Select
                    value={decision.skill ?? 'unset'}
                    onValueChange={(value) => {
                      if (value === 'unset') {
                        clearSlot(level);
                        return;
                      }
                      chooseSkill(level, value as SagaTreeSkillKey, decision);
                    }}
                  >
                    <SelectTrigger className="min-h-11" aria-label={`Level ${level} Fertigkeit`}><SelectValue placeholder="Skill …" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">—</SelectItem>
                      {sagaTreeSkillDefinitions.map((skill) => {
                        const rank = ranksBefore[skill.key];
                        const rankUpOk = rank >= 1 && rank + 1 <= cap;
                        const learnOk = rank === 0;
                        const specCount = specializations.filter((entry) => entry.skill === skill.key).length;
                        const specOk = isValidSpecializationForSkillRank(rank, specCount);
                        const disabled = decision.kind === 'learn' ? !learnOk
                          : decision.kind === 'specialization' ? !specOk
                            : decision.kind === 'rank-up' ? !rankUpOk
                              : false;
                        return (
                          <SelectItem key={skill.key} value={skill.key} disabled={disabled}>
                            {skill.label} (Rang {rank})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {decision.kind === 'specialization' ? (
                <div className="space-y-1">
                  <Label id={`slot-spec-name-label-${level}`}>Spezialisierungsname</Label>
                  <Input
                    value={decision.name ?? ''}
                    onChange={(event) => changeSpecName(level, decision, event.target.value)}
                    placeholder="z. B. Chirurgie"
                    aria-label={`Level ${level} Spezialisierungsname`}
                  />
                </div>
              ) : null}

              {decision.kind && decision.skill ? (
                <p className="text-xs text-muted-foreground">
                  {decision.kind === 'rank-up' && `${getSagaTreeSkill(decision.skill).label}: ${ranksBefore[decision.skill]} → ${ranksBefore[decision.skill] + 1}`}
                  {decision.kind === 'learn' && `${getSagaTreeSkill(decision.skill).label}: 0 → 1`}
                  {decision.kind === 'specialization' && decision.name?.trim() ? `Spezialisierung „${decision.name}" auf ${getSagaTreeSkill(decision.skill).label}` : null}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
