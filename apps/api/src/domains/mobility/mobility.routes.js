import { Router } from 'express';
import { asyncHandler } from '../../core/http.js';
import {
  getMetroStations,
  getMetrobusStations,
  getMobilityNetwork
} from './mobility.service.js';

export const mobilityRouter = Router();

mobilityRouter.get(
  '/network',
  asyncHandler(async (_request, response) => {
    response.json(await getMobilityNetwork());
  })
);

mobilityRouter.get(
  '/stations/metro',
  asyncHandler(async (_request, response) => {
    response.json(await getMetroStations());
  })
);

mobilityRouter.get(
  '/stations/metrobus',
  asyncHandler(async (_request, response) => {
    response.json(await getMetrobusStations());
  })
);
