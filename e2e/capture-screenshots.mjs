// Скриншоты для README с демо-версии: node capture-screenshots.mjs <папка для png> <папка для видео>
// Нужна запущенная демо-сборка (vite preview) на BASE и установленный Microsoft Edge.
import { chromium } from '@playwright/test';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4180';
const [OUT, VIDEO] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge' });

async function open(options = {}) {
    const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 800 }, locale: 'ru-RU', ...options });
    return { context, page: await context.newPage() };
}

async function login(page, username) {
    await page.goto('/login');
    await page.getByRole('banner').getByRole('button', { name: 'Войти', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Вход' });
    await dialog.locator('input[name="login"]').fill(username);
    await dialog.locator('input[name="password"]').fill('admin');
    await dialog.getByRole('button', { name: 'Войти', exact: true }).click();
}

async function shot(page, name) {
    await page.waitForTimeout(900); // плавное появление окон и карточек
    await page.screenshot({ path: `${OUT}/${name}.png` });
}

// Стартовая страница
let { context, page } = await open();
await page.goto('/');
await shot(page, 'landing');
await context.close();

// Ключевой сценарий клиента — он же видео для GIF
({ context, page } = await open({ recordVideo: { dir: VIDEO, size: { width: 1280, height: 800 } } }));
await login(page, 'veter');
await page.getByRole('heading', { level: 1 }).filter({ hasText: 'Добрый день' }).waitFor();
await shot(page, 'client-dashboard');
await page.getByRole('button', { name: 'Подобрать кредит' }).first().click();
await page.getByRole('button', { name: 'Или опишите задачу своими словами' }).click();
await page.locator('textarea').first().fill('Нужно 3 млн на закупку товара к сезону, верну за 2 года');
await page.getByRole('button', { name: 'Подобрать по описанию' }).click();
await page.getByText('Я понял так', { exact: true }).waitFor();
await shot(page, 'client-new-application');
const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Кредит на развитие бизнеса', exact: true }) });
await card.getByRole('button', { name: 'Оформить заявку' }).click();
await page.getByLabel('Выручка за последний год').fill('120000000');
await page.getByRole('button', { name: 'Далее' }).click();
for (const consent of ['Согласие на запрос кредитной истории в бюро кредитных историй', 'Согласие на обработку персональных данных']) {
    await page.getByText(consent, { exact: true }).click();
}
await page.getByRole('button', { name: 'Отправить заявку' }).click();
await page.getByRole('heading', { name: 'Кредит одобрен' }).waitFor({ timeout: 30_000 });
await shot(page, 'client-offer');
await page.getByRole('button', { name: 'Принять предложение' }).click();
await page.getByRole('button', { name: 'Подписать договор' }).click();
const password = page.getByRole('dialog').locator('input[type="password"]');
await password.fill('admin');
await password.press('Enter');
await page.getByText('Кредит выдан').first().waitFor({ timeout: 30_000 });
await shot(page, 'client-issued');
await context.close();

// Рабочее место аналитика
({ context, page } = await open());
await login(page, 'analyst');
await page.getByRole('heading', { level: 1, name: 'Очередь заявок' }).waitFor();
await shot(page, 'bank-queue');
await page.getByRole('row', { name: /Гранд Девелопмент/ }).click();
await page.getByRole('heading', { name: 'ООО «Гранд Девелопмент»' }).waitFor();
await shot(page, 'bank-dossier');
await context.close();

// Администратор: конвейер и сбои
({ context, page } = await open());
await login(page, 'admin');
await page.getByRole('link', { name: 'Конвейер и сбои' }).click();
await page.waitForLoadState('networkidle');
await shot(page, 'admin-pipeline');
await context.close();

// Телефон
({ context, page } = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }));
await login(page, 'veter');
await page.getByRole('heading', { level: 1 }).filter({ hasText: 'Добрый день' }).waitFor();
await shot(page, 'mobile');
await context.close();

await browser.close();
console.log('ok');
