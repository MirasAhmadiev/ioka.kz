import { test, expect } from '@playwright/test';
import { ContactFormPage, type ContactFormData } from '../../pages/ContactFormPage';

const validData: ContactFormData = {
  name: 'Иван Петров',
  phone: '+7 777 123 45 67',      
  email: 'ivan.petrov@example.com',
  company: 'ТОО «Ромашка»',
  bin: '123456789012',           
};

test('Отправка с валидными данными', async ({ page }) => {
    const form = new ContactFormPage(page);

    await test.step('Открыть форму', async () => {
      await form.goto();
      await expect(form.submitBtn).toBeVisible();
    });

    await test.step('Заполнить валидными данными', async () => {
      await form.fillForm(validData);
      await form.expectSubmitEnabled();
    });

    await test.step('Отправить и проверить успех', async () => {
      await form.submit();
      await form.expectSuccess();
      await form.expectNoValidationErrors();
    });
  });


test('Отправка с невалидныи e-mail', async ({ page }) => {
  const form = new ContactFormPage(page);
  await form.goto();

  await form.fillForm(validData);
  await form.setEmail('4y5');

  await form.submit();
  await form.expectInvalidEmail();
});

test('Отправка пустой формы: показываются все обязательные поля', async ({ page }) => {

  const form = new ContactFormPage(page);
  await form.goto();
  await form.submit();
// отправляем пустые данные
  await expect(form.requiredError.first()).toBeVisible({ timeout: 5000 });
  await expect(form.requiredError).toHaveCount(5);
});

