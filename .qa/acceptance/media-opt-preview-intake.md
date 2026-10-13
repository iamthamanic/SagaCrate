# Feature: media-opt-preview-intake (#634)

## Intent
Wiederverwendbare sofortige lokale Vorschau und Statusmaschine für Medienuploads bereitstellen.

## Happy Path
- [ ] Object URL der Originaldatei ist unmittelbar vor Encoding sichtbar (`previewing` → `optimizing`)
- [ ] Status deckt previewing/optimizing/ready/uploading/complete/aborted/failed ab
- [ ] Replace/Abort/Unmount verhindert stale completions und URL-Leaks
- [ ] AU-Gates: deutsche Statuslabels, `isBusy`, `canRetry` für Lade-/Fehler-/Retry-Zustände
- [ ] Touched files: zero type escape hatches (typed-strict / Boy Scout)

## Implementation Notes
- `src/app/media/intake/useMediaOptimizeIntake.ts` + public `src/app/media/index.ts`
- Pure helpers: `intake-session.ts`, `object-url-registry.ts`, `intake-types.ts`
- No Storage service; callers supply `upload(uploader)`
