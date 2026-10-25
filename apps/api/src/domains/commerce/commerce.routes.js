import { Router } from 'express';
import { asyncHandler } from '../../core/http.js';
import { getDirectory, searchTianguis } from './commerce.service.js';

export const commerceRouter = Router();

commerceRouter.get(
  '/directory',
  asyncHandler(async (_request, response) => {
    response.json(await getDirectory());
  })
);

commerceRouter.get(
  '/tianguis',
  asyncHandler(async (request, response) => {
    response.json(
      await searchTianguis({
        day: request.query.day,
        alcaldia: request.query.alcaldia,
        colonia: request.query.colonia,
        direccion: request.query.direccion,
        giro: request.query.giro,
        vialidad: request.query.vialidad,
        q: request.query.q
      })
    );
  })
);
