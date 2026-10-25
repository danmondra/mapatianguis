import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = createApp().listen(PORT, HOST, () => {
  console.log(`API Mapatianguis en http://localhost:${PORT}/api/v1/health`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
