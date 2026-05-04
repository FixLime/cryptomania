import { config } from '../lib/config.js';

export async function tgNotify(telegramId: string, text: string) {
  try {
    const url = `https://api.telegram.org/bot${config.bot.token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error('[notify] failed', e);
  }
}
