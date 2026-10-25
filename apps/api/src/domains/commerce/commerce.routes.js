import { Router } from 'express';
import { asyncHandler } from '../../core/http.js';
import { getDirectory, getMsr, searchMercados, searchTianguis } from './commerce.service.js';

export const commerceRouter = Router();

commerceRouter.get(
  '/directory',
  asyncHandler(async (_request, response) => {
    response.json(await getDirectory());
  })
);

commerceRouter.get(
  '/mercados',
  asyncHandler(async (request, response) => {
    response.json(
      await searchMercados({
        q: request.query.q,
        alcaldia: request.query.alcaldia
      })
    );
  })
);

commerceRouter.get(
  '/msr',
  asyncHandler(async (_request, response) => {
    response.json(await getMsr());
  })
);

commerceRouter.get(
  '/tianguis',
  asyncHandler(async (request, response) => {
    response.json(
      await searchTianguis({
        day: request.query.day,
        alcaldia: request.query.alcaldia,
        q: request.query.q
      })
    );
  })
);
