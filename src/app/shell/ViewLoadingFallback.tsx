/**
 * Lightweight fallback while lazy-loaded views are fetched.
 * Location: src/app/shell/ViewLoadingFallback.tsx
 */
import { SagaTreeLogo } from './SagaTreeLogo';

export function ViewLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite" aria-busy="true">
      <div className="space-y-3 text-center">
        <SagaTreeLogo className="mx-auto h-16 w-16" />

        <p className="text-sm text-muted-foreground">Lädt…</p>
      </div>
    </div>
  );
}
