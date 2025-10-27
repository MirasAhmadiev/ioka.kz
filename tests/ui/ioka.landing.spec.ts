import { test } from '@playwright/test';
import { IokaLandingPage } from '../../pages/IokaLandingPage';

test.describe('ioka.kz/ru — герой (UI & контент)', () => {
  test('UI-проверка и проверка контента', async ({ page }) => {
    const landing = new IokaLandingPage(page);

    await landing.goto();
    await landing.assertUI();
    await landing.assertContent();
  });
});
