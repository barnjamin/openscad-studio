import { test, expect } from '../../fixtures/app.fixture';

test.describe('Startup welcome', () => {
  test('fresh web startup shows the welcome screen until the user dismisses it', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as Window & { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__ = true;
      localStorage.clear();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const nuxPicker = page.getByTestId('nux-layout-picker');
    await expect(nuxPicker).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('nux-layout-option-default').click();
    await page.getByTestId('nux-layout-continue').click();
    await expect(nuxPicker).toBeHidden({ timeout: 10_000 });

    await expect(page.getByTestId('welcome-container')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('welcome-screen')).toBeVisible();
    await expect(page.getByTestId('app-container')).toHaveCount(0);

    await page.getByTestId('welcome-start-empty-project').click();

    await expect(page.getByTestId('welcome-container')).toHaveCount(0);
    await expect(page.getByTestId('app-container')).toBeVisible({ timeout: 10_000 });
  });
});
