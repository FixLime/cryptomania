import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

if (!BOT_TOKEN) throw new Error('BOT_TOKEN required');
if (!WEBAPP_URL) throw new Error('WEBAPP_URL required');

const bot = new Bot(BOT_TOKEN);

bot.command('start', async (ctx) => {
  const isAdmin = ADMIN_IDS.includes(String(ctx.from?.id));
  const kb = new InlineKeyboard()
    .webApp('💼 Открыть кошелёк', WEBAPP_URL);
  if (isAdmin) {
    kb.row().webApp('🛡 Админ-панель', `${WEBAPP_URL}/#/admin`);
  }
  await ctx.reply(
    `👋 Привет, ${ctx.from?.first_name ?? 'друг'}!\n\n` +
      `🔐 *CryptoMania Wallet* — мультивалютный криптокошелёк прямо в Telegram.\n\n` +
      `Поддерживаемые сети:\n` +
      `• TON\n• USDT (TON)\n• USDT (TRC-20)\n• Ethereum\n• Bitcoin\n\n` +
      `Нажми кнопку ниже, чтобы начать 👇`,
    { reply_markup: kb, parse_mode: 'Markdown' },
  );
});

bot.command('wallet', async (ctx) => {
  const kb = new InlineKeyboard().webApp('💼 Открыть кошелёк', WEBAPP_URL);
  await ctx.reply('Открыть кошелёк:', { reply_markup: kb });
});

bot.command('admin', async (ctx) => {
  if (!ADMIN_IDS.includes(String(ctx.from?.id))) {
    return ctx.reply('⛔ Доступ только для администраторов.');
  }
  const kb = new InlineKeyboard().webApp('🛡 Админ-панель', `${WEBAPP_URL}/#/admin`);
  await ctx.reply('Админ-панель:', { reply_markup: kb });
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `Команды:\n` +
      `/start — главное меню\n` +
      `/wallet — открыть кошелёк\n` +
      `/admin — админ-панель (только админы)\n` +
      `/help — эта справка`,
  );
});

bot.catch((err) => console.error('[bot] error', err));

console.log('[bot] starting...');
bot.start();
