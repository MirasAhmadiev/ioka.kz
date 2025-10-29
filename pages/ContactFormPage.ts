import { expect, type Locator, type Page } from '@playwright/test';

export type ContactFormData = {
  name: string;
  phone: string;
  email: string;
  company: string;
  bin: string;
};

export class ContactFormPage {
  readonly page: Page;
  readonly root: Locator;
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly companyInput: Locator;
  readonly binInput: Locator;
  readonly submitBtn: Locator;
  readonly requiredError: Locator;
  readonly successText: Locator;
  readonly successDialog: Locator;
  readonly successOkBtn: Locator;
  readonly thanksUrlRe = /\/thanks\/?$/;
  
  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('form').filter({
      has: page.getByPlaceholder('Ваше имя')
    });


    // поля ищем ТОЛЬКО внутри этого root
    this.nameInput    = this.root.getByPlaceholder('Ваше имя');
    this.phoneInput   = this.root.getByPlaceholder('Номер телефона');
    this.emailInput   = this.root.getByPlaceholder('E-mail');
    this.companyInput = this.root.getByPlaceholder('Название компании');
    // если пятое поле — это сайт/БИН, подставь правильный placeholder:
    this.binInput     = this.root.getByPlaceholder('Сайт компании');
    this.submitBtn    = this.root.getByRole('button', { name: /^Отправить$/ });
    this.requiredError = this.root.getByText('Обязательное поле', { exact: true });
    this.successText   = page.getByText(/(спасибо|заявка отправлена)/i);

    this.successDialog = page.getByRole('dialog').filter({ hasText: 'Благодарим за заявку' });
    this.successOkBtn  = page.getByRole('button', { name: 'Хорошо' });

  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  private async ensureFormReady() {
    // 2) Дождаться гидрации/стабильности перед кликом
    await this.root.scrollIntoViewIfNeeded();
    await this.page.waitForLoadState('networkidle');  // коротко и по делу
    await expect(this.submitBtn).toBeVisible();
    await expect(this.submitBtn).toBeEnabled();
  }


  private async clearAndType(el: Locator, value: string) {
    await el.waitFor({ state: 'visible' });
    await el.fill('');          // гарантированно очищает даже после ре-рендеров
    await el.fill(value);       // одним вызовом — и быстрее, и стабильнее
    await expect(el).toHaveValue(value);
  }


  digitsOnly(s: string) {
    return s.replace(/\D/g, '');
  }

  async fillValidData(data: ContactFormData) {
    await this.ensureFormReady();

    await this.clearAndType(this.nameInput, data.name);

    // Телефон без проверок: просто цифры, маска сама всё расставит
    await this.phoneInput.fill(this.digitsOnly(data.phone) || '77771234567');
    await this.phoneInput.blur(); // чтобы триггернуть валидацию, если нужно

    await this.clearAndType(this.emailInput, data.email);
    await this.clearAndType(this.companyInput, data.company);
    await this.clearAndType(this.binInput, data.bin);
  }



  async expectSubmitEnabled() {
    await expect(this.submitBtn).toBeVisible();
    await expect(this.submitBtn).toBeEnabled();
  }

  async submit() {
    await this.ensureFormReady();
    await this.submitBtn.scrollIntoViewIfNeeded();
    await this.submitBtn.click();
  }
  async submitEmpty() {
    await this.ensureFormReady();
      // 3) Клик без ожидания навигации, чтобы не "улетать" к #/вверх
    await this.submitBtn.click({ noWaitAfter: true });
      // 4) Ждём появление ошибок в той же форме
    await expect(this.requiredError).toHaveCount(5, { timeout: 5000 });
  }

  async expectNoValidationErrors() {
    await expect(this.requiredError).toHaveCount(0);
  }


  async expectSuccess(timeout = 15000) {
    const modal = this.page
      .getByRole('dialog')
      .filter({ hasText: 'Благодарим за заявку' })
      .waitFor({ state: 'visible', timeout });

    const thanks = this.page.waitForURL(/\/thanks(\?|$)/, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    await Promise.race([modal, thanks]).catch(async () => {
      // соберём состояние формы для дебага
      const state = {
        name:  await this.nameInput.inputValue().catch(()=>'ERR'),
        phone: await this.phoneInput.inputValue().catch(()=>'ERR'),
        email: await this.emailInput.inputValue().catch(()=>'ERR'),
        submitDisabled: await this.submitBtn.isDisabled().catch(()=>true),
      };
      throw new Error(
        `Не найден признак успеха (ни модалки, ни /thanks). ` +
        `state=${JSON.stringify(state)}`
      );
    });
  }


  async setEmail(value: string) {
    await this.emailInput.fill(value);
  }

  async expectInvalidEmail() {

    await expect(this.emailInput).toHaveAttribute(
        'class',
        /(^|\s)border-red-500(\s|$)/,
        { timeout: 4000 }
    );

    const cls = (await this.emailInput.getAttribute('class')) ?? '';
    expect(cls).toMatch(/border-red-500|ring-red-500/i);

    await expect(this.successDialog).not.toBeVisible({ timeout: 4000 });
  }
}
