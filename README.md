# CryptoMania — мультивалютный криптокошелёк в Telegram Mini App

Полноценный кастодиальный криптокошелёк, встроенный в Telegram Mini App, с админ-панелью, KYC-верификацией, ручным одобрением выводов и журналом аудита.

## Поддерживаемые валюты

- **TON** — нативная для Telegram
- **USDT (TON)** — Jetton USD₮
- **USDT (TRC-20)** — сеть Tron
- **Ethereum (ETH)**
- **Bitcoin (BTC)** — депозиты; вывод через сторонний node (заглушка для MVP)

## Архитектура

```
CryptoMania/
├── backend/   — Fastify API + Prisma + крипто-адаптеры + воркеры мониторинга
├── bot/       — Telegram-бот на grammY (кнопка запуска WebApp)
├── frontend/  — React + Vite Mini App (с TON Connect и Haptic Feedback)
└── docker-compose.yml — PostgreSQL
```

### Безопасность
- Приватные ключи шифруются **AES-256-GCM** мастер-ключом из `MASTER_ENCRYPTION_KEY`.
- Аутентификация через подпись Telegram WebApp `initData` (HMAC-SHA256 с токеном бота).
- Защита от replay-атак: initData старше 24ч отвергается.
- Выводы выше лимита (по умолчанию $100) требуют ручного одобрения админа.
- KYC обязателен перед выводом.
- Полный аудит-лог всех чувствительных действий.

### Хаптик-обратная связь (вибрация)
В Mini App используется `Telegram.WebApp.HapticFeedback`:
- `selectionChanged` — переключение вкладок, селектов
- `impactOccurred(light/medium/heavy)` — нажатия кнопок, открытие экранов, подтверждение крупных операций
- `notificationOccurred(success/warning/error)` — результат операции (вывод, KYC, копирование адреса)

## Быстрый старт

### 1. Telegram-бот
1. Создайте бота через [@BotFather](https://t.me/BotFather) → получите `BOT_TOKEN`.
2. В BotFather: `/newapp` → привяжите Mini App к URL `https://your-domain.com`.
3. Запишите свой Telegram ID в `ADMIN_TELEGRAM_IDS` (узнать ID — [@userinfobot](https://t.me/userinfobot)).

### 2. Установка

```bash
# 1. Сгенерируйте мастер-ключ шифрования (32 байта hex):
openssl rand -hex 32

# 2. Скопируйте .env.example → .env и заполните значения
cp .env.example .env

# 3. Запустите БД
docker compose up -d postgres

# 4. Установите зависимости
npm install

# 5. Сгенерируйте Prisma client + примените миграции
cd backend
npx prisma migrate dev --name init
cd ..

# 6. Запуск (3 процесса параллельно: API, бот, фронт)
npm run dev

# В отдельном терминале — воркеры мониторинга:
cd backend && npm run worker
```

### 3. Развёртывание Mini App
- Фронтенд должен быть доступен по HTTPS (Telegram Mini App не работает по HTTP).
- Для разработки можно использовать `cloudflared tunnel` или `ngrok`.
- Прописать URL фронтенда в `WEBAPP_URL` и в настройках бота через BotFather.

## Структура БД (Prisma)

- **User** — пользователь (telegram_id, статус ACTIVE/FROZEN/BANNED, KYC статус, isAdmin)
- **Wallet** — кошелёк (uniq по user+currency, address, encryptedPrivateKey, balance, lockedBalance)
- **Transaction** — транзакция (DEPOSIT/WITHDRAWAL, статус PENDING→AWAITING_APPROVAL→APPROVED→BROADCASTING→CONFIRMED)
- **KycSubmission** — заявка KYC (документ + селфи, на проверке/одобрено/отклонено)
- **AuditLog** — журнал аудита (actor, target, action, metadata)

## Админ-панель

Доступна по `https://your-domain.com/#/admin` (только для пользователей из `ADMIN_TELEGRAM_IDS`).

Возможности:
- **Обзор** — статистика
- **KYC** — одобрение/отклонение заявок
- **Выводы** — одобрение/отклонение крупных выводов
- **Юзеры** — поиск, заморозка, разблокировка, бан
- **Аудит** — журнал всех действий

## ⚠️ Важно для продакшена

1. **MASTER_ENCRYPTION_KEY**: ОДИН РАЗ установите — менять нельзя, потеряете ключи всех пользователей. Храните в KMS / HashiCorp Vault, не в `.env` на сервере.
2. **Хот-кошельки** для отправки исходящих платежей должны быть отдельными от cold storage. Держите минимум средств для текущих выводов.
3. **BTC вывод**: реализована только генерация адресов и мониторинг депозитов. Для отправки нужен собственный Bitcoin node + UTXO selection (см. `backend/src/crypto/btc.ts`).
4. **USDT-TON отправка**: реализован баланс/мониторинг; для отправки требуется построение Jetton transfer message (TODO в `usdtTon.ts`).
5. **Юридическая сторона**: кастодиальный сервис — это работа с деньгами клиентов. Проконсультируйтесь с юристом по поводу лицензирования (MSB / VASP в вашей юрисдикции).
6. **KYC-провайдер**: для серьёзного продакшена интегрируйте Sumsub / Onfido вместо ручной модерации.
7. **Rate limiting + WAF** перед API.
8. **Sentry / Pino logs** в продакшене.

## Команды бота

- `/start` — главное меню с кнопкой запуска кошелька
- `/wallet` — открыть кошелёк
- `/admin` — открыть админ-панель (только админы)
- `/help` — справка

## Лицензия

Делайте что хотите.
