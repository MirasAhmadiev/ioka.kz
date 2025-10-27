import { expect, Locator, Page } from '@playwright/test';

export class IokaLandingPage {
  readonly page: Page;

  private readonly header: Locator;
  readonly productsBtn: Locator;    
  readonly pricingLink: Locator;
  readonly aboutLink: Locator;
  readonly blogLink: Locator;
  readonly devBtn: Locator;
  readonly langButton: Locator;
  readonly signInButton: Locator;

  readonly h1: Locator;
  readonly h2: Locator;
  readonly leadText: Locator;
  readonly ctaLink: Locator;
  readonly ctaButton: Locator;
  readonly heroImage: Locator;
  readonly heroSection: Locator;

  constructor(page: Page) {
    this.page = page;

    this.header       = page.locator('header');
    this.productsBtn  = this.header.getByRole('button', { name: 'Продукты' });   
    this.pricingLink  = this.header.getByRole('link',   { name: 'Тарифы' });
    this.aboutLink    = this.header.getByRole('link',   { name: 'О компании' });
    this.blogLink     = this.header.getByRole('link',   { name: 'Блог' });
    this.devBtn  = this.header.getByRole('button', { name: 'Разработчикам' });
    this.langButton   = this.header.getByRole('button', { name: 'RU' });
    this.signInButton = this.header.getByRole('button', { name: 'Войти' });

    this.h1 = page.getByRole('heading', { name: /Подключение\s+онлайн оплаты/i, level: 1 });
    this.h2 = page.getByRole('heading', { name: /Интернет-эквайринг для бизнеса/i, level: 2 });
    this.leadText  = page.getByText(/Удобное и безопасное решение.*приема онлайн платежей/i);
    this.ctaLink   = page.getByRole('link',   { name: 'Подключиться' });
    this.ctaButton = page.getByRole('button', { name: 'Подключиться' });
    this.heroSection = page.locator('section', { has: this.h1 });
    this.heroImage = this.heroSection.getByRole('img', { name: 'payment' });
  }

  async goto() {
    await this.page.goto('/');
    await this.h1.waitFor();
  }

  async assertUI() {
    await expect(this.productsBtn).toBeVisible();
    await expect(this.productsBtn).toBeEnabled();

    for (const l of [this.pricingLink, this.aboutLink, this.blogLink]) {
      await expect(l).toBeVisible();
      await expect(l).toHaveAttribute('href', /^\/ru(\/|$)/);
    }

    await expect(this.langButton).toBeVisible();
    await expect(this.signInButton).toBeVisible();

    await expect(this.h1).toBeVisible();
    await expect(this.h2).toBeVisible();
    await expect(this.ctaButton).toBeVisible();
    await expect(this.ctaLink).toHaveAttribute('href', "/ru#integration-form");
    await expect(this.heroImage).toBeVisible();
  }

  async assertContent() {
    expect(await this.page.locator('html').getAttribute('lang')).toBe('ru');
    await expect(this.h1).toHaveText(/Подключение\s+онлайн оплаты/i);
    await expect(this.h2).toHaveText(/Интернет-эквайринг для бизнеса/i);
    await expect(this.leadText).toBeVisible();
    await expect(this.ctaButton).toHaveText('Подключиться');
  }
}
