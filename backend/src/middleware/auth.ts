import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { isAdminTelegramId, verifyInitData } from '../lib/telegramAuth.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      telegramId: string;
      isAdmin: boolean;
      status: string;
    };
  }
}

export async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const initData = req.headers['x-telegram-init-data'];
  if (typeof initData !== 'string') {
    return reply.code(401).send({ error: 'Missing initData' });
  }
  const tgUser = verifyInitData(initData);
  if (!tgUser) {
    return reply.code(401).send({ error: 'Invalid initData' });
  }

  const telegramId = String(tgUser.id);
  const isAdmin = isAdminTelegramId(telegramId);

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      languageCode: tgUser.language_code,
      isAdmin,
    },
    create: {
      telegramId,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      languageCode: tgUser.language_code,
      isAdmin,
    },
  });

  if (user.status === 'BANNED') {
    return reply.code(403).send({ error: 'Account banned' });
  }

  req.user = {
    id: user.id,
    telegramId: user.telegramId,
    isAdmin: user.isAdmin,
    status: user.status,
  };
}

export async function adminOnly(req: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(req, reply);
  if (reply.sent) return;
  if (!req.user?.isAdmin) {
    return reply.code(403).send({ error: 'Admin only' });
  }
}
