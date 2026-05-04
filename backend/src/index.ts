import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './lib/config.js';
import { meRoutes } from './routes/me.js';
import { withdrawRoutes } from './routes/withdraw.js';
import { kycRoutes } from './routes/kyc.js';
import { adminRoutes } from './routes/admin.js';
import { transferRoutes } from './routes/transfer.js';
import { addressBookRoutes } from './routes/addressBook.js';
import { settingsRoutes } from './routes/settings.js';

const app = Fastify({
  logger: { transport: { target: 'pino-pretty', options: { colorize: true } } },
});

await app.register(cors, { origin: true, credentials: true });
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

app.get('/health', async () => ({ ok: true, ts: Date.now() }));

await app.register(meRoutes, { prefix: '/api' });
await app.register(withdrawRoutes, { prefix: '/api' });
await app.register(kycRoutes, { prefix: '/api' });
await app.register(transferRoutes, { prefix: '/api' });
await app.register(addressBookRoutes, { prefix: '/api' });
await app.register(settingsRoutes, { prefix: '/api' });
await app.register(adminRoutes, { prefix: '/api' });

(BigInt.prototype as any).toJSON = function () { return this.toString(); };

app
  .listen({ port: config.port, host: '0.0.0.0' })
  .then((addr) => app.log.info(`API listening on ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
