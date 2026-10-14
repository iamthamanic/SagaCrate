/**
 * Session Lobby Meet-style media preview — structural smoke (#678).
 * Location: e2e/session-lobby-media-preview.spec.ts
 *
 * Does not click getUserMedia probes in CI (no fake devices / hang risk).
 * Local evidence screenshots live under .qa/evidence/session-lobby-media-preview/.
 */
import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './helpers/auth';
import { expectNoHorizontalOverflow } from './helpers/adaptive-ui-quality';

const SAGA_PUBLIC_ID = 'SA-K7M4Q';
const SESSION_PUBLIC_ID = 'SE-K7M4Q';

test.describe('Session Lobby media preview (#678)', () => {
  test('media cards idle; no Dein Platz; probes present', async ({ page }) => {
    test.setTimeout(90_000);
    await ensureLoggedIn(page);
    await page.goto(`/sagas/${SAGA_PUBLIC_ID}/sessions/${SESSION_PUBLIC_ID}/lobby`);
    await expect(page.locator('[data-session-lobby-media]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-session-lobby-self]')).toHaveCount(0);
    await expect(page.getByText('Dein Platz')).toHaveCount(0);
    await expect(page.locator('[data-session-lobby-probe-camera]')).toBeVisible();
    await expect(page.locator('[data-session-lobby-probe-mic]')).toBeVisible();
    await expect(page.locator('[data-session-lobby-probe-liveact]')).toBeVisible();
    await expect(page.locator('[data-session-lobby-camera-idle]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
