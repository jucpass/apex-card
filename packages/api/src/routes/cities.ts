import express from 'express';
import {
  parseCityListQuery,
  parseCreateCityInput,
  parseUpdateCityInput,
  parseUpdateCityStatusInput,
  type CityDetailsResponse,
  type CityListResponse,
} from '@apex-card/shared';

import { badRequest, conflict, handleAdminError, notFound } from '../lib/httpErrors';
import {
  createCity,
  getCityById,
  listActiveCitiesByCountry,
  listCities,
  updateCity,
  updateCityStatus,
} from '../services/cities';

const router: express.Router = express.Router();

// Future Partner city selector — active cities scoped to one country. Kept as a small
// dedicated read rather than reusing the paginated admin list below, since a Partner form
// just needs a flat `{id, name}[]` for a dropdown.
router.get(
  '/by-country/:countryId',
  async (req, res: express.Response<{ cities: { id: string; name: string }[] }>) => {
    try {
      const result = await listActiveCitiesByCountry(req.params.countryId);

      if (result === 'COUNTRY_NOT_FOUND') {
        return notFound(res, 'Country not found.');
      }

      res.json(result);
    } catch (error) {
      handleAdminError(res, error);
    }
  }
);

router.get('/', async (req, res: express.Response<CityListResponse>) => {
  const parsed = parseCityListQuery(req.query);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    res.json(await listCities(parsed.data));
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/:id', async (req, res: express.Response<CityDetailsResponse>) => {
  try {
    const city = await getCityById(req.params.id);

    if (!city) {
      return notFound(res, 'City not found.');
    }

    res.json({ city });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/', async (req, res: express.Response<CityDetailsResponse>) => {
  const parsed = parseCreateCityInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await createCity(parsed.data);

    if (result === 'COUNTRY_NOT_FOUND') {
      return badRequest(res, 'Select a valid country.');
    }

    if (result === 'DUPLICATE_NAME') {
      return conflict(res, 'A city with this name already exists in this country.');
    }

    res.status(201).json({ city: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id', async (req, res: express.Response<CityDetailsResponse>) => {
  const parsed = parseUpdateCityInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updateCity(req.params.id, parsed.data);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'City not found.');
    }

    if (result === 'COUNTRY_NOT_FOUND') {
      return badRequest(res, 'Select a valid country.');
    }

    if (result === 'DUPLICATE_NAME') {
      return conflict(res, 'A city with this name already exists in this country.');
    }

    res.json({ city: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id/status', async (req, res: express.Response<CityDetailsResponse>) => {
  const parsed = parseUpdateCityStatusInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updateCityStatus(req.params.id, parsed.data.active);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'City not found.');
    }

    res.json({ city: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

export default router;
