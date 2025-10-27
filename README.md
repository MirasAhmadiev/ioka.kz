ioka-tests — Playwright UI & API
1) Назначение

Короткий набор UI и API-тестов для сайта ioka с поддержкой моков и Allure-отчёта.

2) Структура
   
pages/
  ContactFormPage.ts
  IokaLandingPage.ts
tests/
  ui/
    contact-form.pom.spec.ts
    ioka.landing.spec.ts
mocks/
  ioka.mock.ts
  ioka.orders.mock.ts
ioka.config.ts
playwright.config.ts
env.example

4) Установка
   
npm i
npx playwright install

6) Переменные окружения
   
Создай .env по образцу env.example.
Обязательные для UI:
UI_BASE_URL=https://ioka.kz/ru

Опционально для реального API:
API_BASE_URL=https://api.ioka.kz
API_KEY=your_key

5) Запуск тестов
   
Все:
npx playwright test

Только UI:
npx playwright test -p ui

Конкретный файл:
npx playwright test tests/ui/contact-form.pom.spec.ts

Фильтр по названию:
npx playwright test -g "форма"

Стабильный одиночный прогон:
npx playwright test --workers=1 --retries=0

6) Отчёт Allure
   
npx allure serve ./allure-results
или
npx allure generate ./allure-results --clean -o ./allure-report

7) Моки API
   
Подключение в хуках тестов:
import { installIokaMocks } from '../mocks/ioka.mock';
import { installIokaOrdersMocks } from '../mocks/ioka.orders.mock';

test.beforeEach(async ({ context }) => {
  await installIokaMocks(context, 'mock');        // /v2/accounts/:id
  await installIokaOrdersMocks(context, 'mock');  // /v2/orders, /v2/payments/:id
});

Особенности:
Без API_KEY моки возвращают 401.
Валидируются ключевые поля, статусы: 200/400/401/404.

8) Что проверяют тесты
   
ioka.landing.spec.ts — контент главного экрана /ru (заголовки, CTA, изображение).
contact-form.pom.spec.ts — форма заявки: успешная отправка, обязательные поля (5 шт.), невалидный email.

10) Ключевые локаторы в POM
    
Поля формы: по placeholder/name.
Сообщения обязательности: p.text-red-500 с текстом Обязательное поле.
Модалка успеха: getByRole('dialog'), кнопка подтверждения getByRole('button', { name: 'Ок' }).

12) Частые проблемы
    
Не видно «Обязательное поле»: после клика дождаться рендера; использовать p.text-red-500 + текст.
401 в API: указать API_KEY или включить моки.
Неверный стенд: переопределить UI_BASE_URL/API_BASE_URL через .env.

14) Полезные команды
    
npx playwright show-trace test-results/**/trace.zip
npx playwright test --reporter=list,allure-playwright
