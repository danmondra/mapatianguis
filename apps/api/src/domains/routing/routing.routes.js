import { Router } from 'express';
import { asyncHandler } from '../../core/http.js';
import { planRoute } from './routing.service.js';

export const routingRouter = Router();

routingRouter.post(
  '/plan',
  asyncHandler(async (request, response) => {
    const body = request.body ?? {};
    response.json(
      await planRoute({
        from: typeof body.from === 'string' ? body.from : undefined,
        to: typeof body.to === 'string' ? body.to : undefined,
        coordinates:
          body.coordinates &&
          Number.isFinite(Number(body.coordinates.lat)) &&
          Number.isFinite(Number(body.coordinates.lon))
            ? { lat: Number(body.coordinates.lat), lon: Number(body.coordinates.lon) }
            : undefined,
        destination:
          body.destination &&
          Number.isFinite(Number(body.destination.lat)) &&
          Number.isFinite(Number(body.destination.lon))
            ? {
                lat: Number(body.destination.lat),
                lon: Number(body.destination.lon),
                label:
                  typeof body.destination.label === 'string'
                    ? body.destination.label
                    : undefined
              }
            : undefined
      })
    );
  })
);
