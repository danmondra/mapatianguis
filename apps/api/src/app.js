import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { API_PREFIX, API_ROUTES } from '@mapatianguis/contracts';
import { readData } from './data/store.js';
import { commerceRouter } from './domains/commerce/commerce.routes.js';
import { feedbackRouter } from './domains/feedback/feedback.routes.js';
import { geoRouter } from './domains/geo/geo.routes.js';
import { mobilityRouter } from './domains/mobility/mobility.routes.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.resolve(HERE, '../../web/dist');

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.use(API_PREFIX, (request, response, next) => {
    if (request.method === 'GET') {
      response.setHeader('Cache-Control', 'public, max-age=300');
    }
    next();
  });

  app.get(API_ROUTES.health, (_request, response) => {
    response.json({
      status: 'ok',
      service: 'mapatianguis-api',
      uptimeSeconds: Math.round(process.uptime())
    });
  });

  app.get(
    API_ROUTES.meta,
    async (_request, response, next) => {
      try {
        const meta = await readData('meta.json');
        response.json({
          ...meta,
          endpoints: API_ROUTES
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.use(`${API_PREFIX}/geo`, geoRouter);
  app.use(`${API_PREFIX}/commerce`, commerceRouter);
  app.use(`${API_PREFIX}/feedback`, feedbackRouter);
  app.use(`${API_PREFIX}/mobility`, mobilityRouter);

  app.use(API_PREFIX, (_request, response) => {
    response.status(404).json({ error: 'Endpoint no encontrado' });
  });

  if (existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST, { maxAge: '1h', index: false }));
    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith(API_PREFIX)) return next();
      response.sendFile(path.join(WEB_DIST, 'index.html'));
    });
  }

  app.use((error, _request, response, _next) => {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error(error);
    response.status(status).json({
      error: status >= 500 ? 'Error interno' : error.message
    });
  });

  return app;
}
