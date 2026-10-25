import { Router } from 'express';
import { asyncHandler } from '../../core/http.js';
import { getAlcaldias, getZmvm } from './geo.service.js';

export const geoRouter = Router();

geoRouter.get(
  '/alcaldias',
  asyncHandler(async (_request, response) => {
    response.json(await getAlcaldias());
  })
);

geoRouter.get(
  '/zmvm',
  asyncHandler(async (_request, response) => {
    response.json(await getZmvm());
  })
);
