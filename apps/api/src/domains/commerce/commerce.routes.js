import { Router } from 'express';
import { asyncHandler } from '../../core/http.js';
import { getDirectory, getMercomuna, getMsr, searchMercomuna, searchTianguis } from './commerce.service.js';

export const commerceRouter = Router();

commerceRouter.get(
  '/directory',
  asyncHandler(async (_request, response) => {
    response.json(await getDirectory());
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

/**
 * Comercios que aceptan vales Mercomuna.
 * Con `?q=` o `?alimentos=1` responde filtrado; sin filtros, el directorio entero.
 */
commerceRouter.get(
  '/mercomuna',
  asyncHandler(async (request, response) => {
    const { q, alimentos } = request.query;
    const onlyFood = alimentos === '1' || alimentos === 'true';

    if (q || onlyFood) {
      response.json(await searchMercomuna({ q, alimentos: onlyFood }));
      return;
    }

    response.json(await getMercomuna());
  })
);
