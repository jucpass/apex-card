import express from 'express';
import multer from 'multer';
import {
  parseCountryListQuery,
  parseCreateCountryInput,
  parseUpdateCountryAvailabilityInput,
  parseUpdateCountryInput,
  parseUpdateCountryStatusInput,
  type CountriesResponse,
  type CountryDetailsResponse,
  type CountryListResponse,
} from '@apex-card/shared';

import { MAX_COUNTRY_IMAGE_BYTES } from '../lib/supabaseAdmin';
import { badRequest, conflict, handleAdminError, notFound } from '../lib/httpErrors';
import {
  createCountry,
  getCountryById,
  listCountries,
  listCountryOptions,
  listPartnerEnabledCountries,
  removeCountryImage,
  setCountryImage,
  updateCountry,
  updateCountryAvailability,
  updateCountryStatus,
} from '../services/countries';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_COUNTRY_IMAGE_BYTES },
});

const router: express.Router = express.Router();

// Lightweight full-list reads for other consumers (Members' home-country select, Cities'
// country picker, and — later — Partner forms). Deliberately unpaginated and unfiltered
// beyond `active`, since these are simple selectors, not the admin management table.
router.get('/options', async (_req, res: express.Response<CountriesResponse>) => {
  try {
    res.json(await listCountryOptions());
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/partner-enabled', async (_req, res: express.Response<CountriesResponse>) => {
  try {
    res.json(await listPartnerEnabledCountries());
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/', async (req, res: express.Response<CountryListResponse>) => {
  const parsed = parseCountryListQuery(req.query);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    res.json(await listCountries(parsed.data));
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/:id', async (req, res: express.Response<CountryDetailsResponse>) => {
  try {
    const country = await getCountryById(req.params.id);

    if (!country) {
      return notFound(res, 'Country not found.');
    }

    res.json({ country });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/', async (req, res: express.Response<CountryDetailsResponse>) => {
  const parsed = parseCreateCountryInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await createCountry(parsed.data);

    if (result === 'DUPLICATE_NAME') {
      return conflict(res, 'A country with this name already exists.');
    }

    res.status(201).json({ country: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id', async (req, res: express.Response<CountryDetailsResponse>) => {
  const parsed = parseUpdateCountryInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updateCountry(req.params.id, parsed.data);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Country not found.');
    }

    if (result === 'DUPLICATE_NAME') {
      return conflict(res, 'A country with this name already exists.');
    }

    res.json({ country: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id/status', async (req, res: express.Response<CountryDetailsResponse>) => {
  const parsed = parseUpdateCountryStatusInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updateCountryStatus(req.params.id, parsed.data.active);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Country not found.');
    }

    res.json({ country: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id/availability', async (req, res: express.Response<CountryDetailsResponse>) => {
  const parsed = parseUpdateCountryAvailabilityInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updateCountryAvailability(req.params.id, parsed.data);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Country not found.');
    }

    if (result === 'EXPLORE_REQUIRES_ACTIVE') {
      return badRequest(res, 'Only an active country can be made visible in Explore.');
    }

    if (result === 'EXPLORE_REQUIRES_IMAGE') {
      return badRequest(res, 'Upload a destination image before enabling Explore visibility.');
    }

    res.json({ country: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post(
  '/:id/image',
  upload.single('image'),
  async (req: express.Request<{ id: string }>, res: express.Response<CountryDetailsResponse>) => {
    if (!req.file) {
      return badRequest(res, 'An image file is required.');
    }

    const altText =
      typeof req.body?.altText === 'string' ? req.body.altText.trim().slice(0, 200) : undefined;

    try {
      const result = await setCountryImage(
        req.params.id,
        { buffer: req.file.buffer, mimetype: req.file.mimetype, size: req.file.size },
        altText
      );

      if (result === 'NOT_FOUND') {
        return notFound(res, 'Country not found.');
      }

      if (result === 'INVALID_TYPE') {
        return badRequest(res, 'Image must be JPEG, PNG, or WebP.');
      }

      if (result === 'TOO_LARGE') {
        return badRequest(res, 'Image must be 5MB or smaller.');
      }

      res.json({ country: result });
    } catch (error) {
      handleAdminError(res, error);
    }
  }
);

router.delete('/:id/image', async (req, res: express.Response<CountryDetailsResponse>) => {
  try {
    const result = await removeCountryImage(req.params.id);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Country not found.');
    }

    res.json({ country: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

export default router;
