import { Router } from 'express';
import { validateFeedbackEvent } from '@mapatianguis/contracts/feedback';
import { asyncHandler } from '../../core/http.js';
import { appendEvent, getSummary } from './feedback.service.js';

export const feedbackRouter = Router();

/**
 * Registra una respuesta voluntaria y anónima sobre un comercio.
 * Body: { fecha, cp, giro, respuesta, encontro, dificultad, busca }.
 * Rechaza cualquier otro campo (coordenadas, nombre, teléfono...) y texto que
 * parezca dato personal.
 */
feedbackRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const result = validateFeedbackEvent(request.body);
    if (!result.ok) {
      response.status(400).json({ error: 'Evento no válido', detalles: result.errors });
      return;
    }
    await appendEvent(result.event);
    response.status(201).json({ ok: true });
  })
);

/** Agregado por CP y giro: aceptados, no aceptados, tasa, dificultad común y productos buscados. */
feedbackRouter.get(
  '/summary',
  asyncHandler(async (_request, response) => {
    // Cambia con cada evento: no aplica el cache de 5 minutos del resto de GET.
    response.setHeader('Cache-Control', 'no-store');
    response.json(await getSummary());
  })
);
