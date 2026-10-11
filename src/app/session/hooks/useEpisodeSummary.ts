/**
 * useEpisodeSummary — GM episode AI summary states for Recap (#573).
 * Location: src/app/session/hooks/useEpisodeSummary.ts
 *
 * idle → generating → draft → approved | failed. Abort via useRef controller.
 */
import { useEffect, useRef, useState } from 'react';
import { sessionRecapService } from '../../../infrastructure/session/session-recap-service';
import {
  sessionRecapAiService,
  type EpisodeSummaryStatus,
} from '../../../infrastructure/session/session-recap-ai-service';

export type EpisodeSummaryUiStatus =
  | 'idle'
  | 'generating'
  | 'draft'
  | 'approved'
  | 'failed';

type UseEpisodeSummaryInput = {
  readonly sessionId: string | null;
  readonly enabled: boolean;
};

export type UseEpisodeSummaryResult = {
  readonly status: EpisodeSummaryUiStatus;
  readonly summaryText: string;
  readonly error: string | null;
  readonly generate: () => Promise<void>;
  readonly saveDraft: (text: string) => Promise<void>;
  readonly approve: () => Promise<void>;
  readonly cancel: () => void;
  readonly setSummaryText: (text: string) => void;
};

function mapPersistedStatus(status: EpisodeSummaryStatus | string | null | undefined): EpisodeSummaryUiStatus {
  if (status === 'approved') return 'approved';
  if (status === 'draft') return 'draft';
  return 'idle';
}

export function useEpisodeSummary(input: UseEpisodeSummaryInput): UseEpisodeSummaryResult {
  const [status, setStatus] = useState<EpisodeSummaryUiStatus>('idle');
  const [summaryText, setSummaryText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const genTokenRef = useRef(0);

  useEffect(() => {
    if (!input.enabled || !input.sessionId) {
      setStatus('idle');
      setSummaryText('');
      setError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const recap = await sessionRecapService.getBySessionId(input.sessionId!);
        if (cancelled) return;
        if (!recap) {
          setStatus('idle');
          setSummaryText('');
          return;
        }
        setSummaryText(recap.summaryText ?? '');
        setStatus(mapPersistedStatus(recap.summaryStatus ?? 'none'));
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Zusammenfassung konnte nicht geladen werden');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [input.enabled, input.sessionId]);

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    genTokenRef.current += 1;
    if (status === 'generating') {
      setStatus(summaryText.trim() ? 'draft' : 'idle');
      setError('Generierung abgebrochen.');
    }
  };

  const generate = async () => {
    if (!input.sessionId || !input.enabled) return;
    const token = ++genTokenRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('generating');
    setError(null);
    try {
      const result = await sessionRecapAiService.generateDraft(input.sessionId);
      if (controller.signal.aborted || token !== genTokenRef.current) return;
      setSummaryText(result.summaryText);
      setStatus('draft');
      setError(null);
    } catch (err) {
      if (controller.signal.aborted || token !== genTokenRef.current) return;
      setStatus('failed');
      setError(
        err instanceof Error
          ? err.message
          : 'Zusammenfassung fehlgeschlagen. Du kannst den Text manuell schreiben.',
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const saveDraft = async (text: string) => {
    if (!input.sessionId || !input.enabled) return;
    setSummaryText(text);
    try {
      const saved = await sessionRecapAiService.saveSummary(input.sessionId, text, 'draft');
      setSummaryText(saved.summaryText ?? text);
      setStatus('draft');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Entwurf konnte nicht gespeichert werden');
    }
  };

  const approve = async () => {
    if (!input.sessionId || !input.enabled) return;
    try {
      const saved = await sessionRecapAiService.saveSummary(
        input.sessionId,
        summaryText,
        'approved',
      );
      setSummaryText(saved.summaryText ?? summaryText);
      setStatus('approved');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Freigabe fehlgeschlagen');
    }
  };

  return {
    status,
    summaryText,
    error,
    generate,
    saveDraft,
    approve,
    cancel,
    setSummaryText,
  };
}
