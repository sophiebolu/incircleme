import { env } from './env';
import { buildApp } from './app';

const app = await buildApp();

try {
  const addr = await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`api listening on ${addr}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
