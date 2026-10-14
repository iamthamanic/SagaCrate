/**
 * Verify-UI evidence for session-lobby-media-preview (#678) — local/CI optional.
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { ensureLoggedIn } from './helpers/auth';
import { expectNoHorizontalOverflow } from './helpers/adaptive-ui-quality';

const SAGA_PUBLIC_ID = 'SA-K7M4Q';
const SESSION_PUBLIC_ID = 'SE-K7M4Q';
const EVIDENCE = path.resolve('.qa/evidence/session-lobby-media-preview');

test.describe('Session Lobby media preview (#678)', () => {
  test('media cards idle; no Dein Platz; probes present', async ({ page, context }) => {
    test.setTimeout(90_000);
    await context.grantPermissions(['camera', 'microphone']);
    await ensureLoggedIn(page);
    await page.goto(`/sagas/${SAGA_PUBLIC_ID}/sessions/${SESSION_PUBLIC_ID}/lobby`);
    await expect(page.locator('[data-session-lobby-media]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-session-lobby-self]')).toHaveCount(0);
    await expect(page.getByText('Dein Platz')).toHaveCount(0);
    await expect(page.locator('[data-session-lobby-probe-camera]')).toBeVisible();
    await expect(page.locator('[data-session-lobby-probe-mic]')).toBeVisible();
    await expect(page.locator('[data-session-lobby-probe-liveact]')).toBeVisible();
    await expect(page.locator('[data-session-lobby-camera-idle]')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE, '01-camera-preview.png'), fullPage: true });

    await page.locator('[data-session-lobby-probe-camera]').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE, '01b-camera-after-probe.png'), fullPage: true });

    await page.locator('[data-session-lobby-probe-mic]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-session-lobby-mic-meter]')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE, '02-mic-meter.png'), fullPage: true });

    await page.locator('[data-session-lobby-probe-liveact]').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE, '03-liveact-character.png'), fullPage: true });

    await expectNoHorizontalOverflow(page);
  });
});
