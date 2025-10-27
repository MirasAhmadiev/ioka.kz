import { expect, Locator, Page } from '@playwright/test';

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
  readonly successModal: Locator;
  readonly successOkBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('form').filter({
    has: page.getByPlaceholder('Ваше имя'),
    }).first();
    this.nameInput    = this.root.getByPlaceholder('Ваше имя');
    this.phoneInput   = this.root.getByPlaceholder('Номер телефона');
    this.emailInput   = this.root.getByPlaceholder(/E-?mail/i);
    this.companyInput = this.root.getByPlaceholder('Название компании');
  
    this.binInput = this.root.locator(
    'input#bin, input[name="bin"], input[placeholder="Сайт компании"]'
    ).first();
    this.submitBtn = this.root.getByRole('button', { name: /отправить/i });
  
    this.requiredError = this.root
    .locator('p.text-red-500')
    .filter({ hasText: 'Обязательное поле' });
    this.successText   = page.getByText(/(спасибо|заявка отправлена)/i);

    this.successModal = page.getByRole('dialog').filter({ hasText: /Благодарим за заявку/i });

    this.successDialog = page.getByRole('dialog').getByText('Благодарим за заявку', { exact: false });
    this.successOkBtn  = page.getByRole('button', { name: /Хорошо/i });

  }

  async goto() {
 
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async fillForm(data: ContactFormData) {
    await this.nameInput.fill(data.name);

    
    await this.phoneInput.click();
    await this.phoneInput.fill('');               
    await this.phoneInput.fill(data.phone);

    await this.emailInput.fill(data.email);
    await this.companyInput.fill(data.company);
    await this.binInput.fill(data.bin);
  }

  async expectSubmitEnabled() {
    await expect(this.submitBtn).toBeVisible();
    await expect(this.submitBtn).toBeEnabled();
  }

  async submit() {
    await this.submitBtn.click();
    await this.page.waitForTimeout(100);
    try { await expect(this.submitBtn).toBeDisabled({ timeout: 3000 }); } catch {}
    try { await expect(this.submitBtn).toBeEnabled({ timeout: 10000 }); } catch {}

    await this.page.waitForLoadState('networkidle').catch(() => {});
  }


  async expectNoValidationErrors() {
    await expect(this.requiredError).toHaveCount(0);
  }

  async expectSuccess() {
    const timeout = 15000;

    const waitForModal = this.successDialog
      .waitFor({ state: 'visible', timeout })
      .then(() => 'modal');

    const waitForThanks = this.page
      .waitForURL(/\/thanks($|[/?])/i, { timeout })
      .then(() => 'thanks');

    const winner = await Promise
      .any([waitForModal, waitForThanks])
      .catch(() => null);

    if (!winner) {
      throw new Error('Не найден признак успешной отправки (ни модалки, ни редиректа /thanks).');
    }

    if (winner === 'modal') {
      await expect(this.successDialog).toBeVisible();
      await expect(this.successOkBtn).toBeVisible();
      await this.successOkBtn.click({ trial: true }).catch(() => {});
    }
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
