import express from 'express';
import multer from 'multer';
import {
  parseCreatePartnerInput,
  parsePartnerListQuery,
  parseUpdatePartnerCategoriesInput,
  parseUpdatePartnerInput,
  parseUpdatePartnerStatusInput,
  PARTNER_MEDIA_MAX_IMAGES,
  type PartnerDetailsResponse,
  type PartnerListResponse,
} from '@apex-card/shared';

import { MAX_IMAGE_BYTES } from '../lib/supabaseAdmin';
import { badRequest, conflict, handleAdminError, notFound } from '../lib/httpErrors';
import {
  createPartner,
  deletePartnerMedia,
  updatePartnerCategories,
  getPartnerById,
  listPartners,
  replacePartnerMedia,
  setPartnerMediaCover,
  updatePartner,
  updatePartnerStatus,
  uploadPartnerMedia,
} from '../services/partners';

const RELATION_ERROR_MESSAGES: Record<string, string> = {
  COUNTRY_NOT_FOUND: 'Select a valid country.',
  CITY_NOT_FOUND: 'Select a valid city.',
  CITY_COUNTRY_MISMATCH: 'The selected city does not belong to the selected country.',
};

const MEDIA_ERROR_RESPONSES: Record<string, { status: 400 | 404; message: string }> = {
  MEDIA_LIMIT_EXCEEDED: {
    status: 400,
    message: `A partner can have at most ${PARTNER_MEDIA_MAX_IMAGES} images.`,
  },
  INVALID_TYPE: { status: 400, message: 'Image must be JPEG, PNG, or WebP.' },
  TOO_LARGE: { status: 400, message: 'Image must be 5MB or smaller.' },
  LAST_IMAGE_ACTIVE: {
    status: 400,
    message: 'An active partner must keep at least one image. Deactivate the partner first.',
  },
  MEDIA_NOT_FOUND: { status: 404, message: 'Image not found for this partner.' },
  NOT_FOUND: { status: 404, message: 'Partner not found.' },
};

const sendMediaError = (res: express.Response, code: string) => {
  const mapped = MEDIA_ERROR_RESPONSES[code];

  if (!mapped) {
    return badRequest(res, 'Invalid image request.');
  }

  return res.status(mapped.status).json({ status: 'error', message: mapped.message });
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: PARTNER_MEDIA_MAX_IMAGES },
});

const router: express.Router = express.Router();

router.get('/', async (req, res: express.Response<PartnerListResponse>) => {
  const parsed = parsePartnerListQuery(req.query);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    res.json(await listPartners(parsed.data));
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/:id', async (req, res: express.Response<PartnerDetailsResponse>) => {
  try {
    const partner = await getPartnerById(req.params.id);

    if (!partner) {
      return notFound(res, 'Partner not found.');
    }

    res.json({ partner });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/', async (req, res: express.Response<PartnerDetailsResponse>) => {
  const parsed = parseCreatePartnerInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await createPartner(parsed.data);

    if (result === 'DUPLICATE_SLUG') {
      return conflict(res, 'A partner with this slug already exists.');
    }

    if (typeof result === 'string') {
      return badRequest(res, RELATION_ERROR_MESSAGES[result] ?? 'Invalid partner details.');
    }

    res.status(201).json({ partner: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id', async (req, res: express.Response<PartnerDetailsResponse>) => {
  const parsed = parseUpdatePartnerInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updatePartner(req.params.id, parsed.data);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Partner not found.');
    }

    if (result === 'DUPLICATE_SLUG') {
      return conflict(res, 'A partner with this slug already exists.');
    }

    if (typeof result === 'string') {
      return badRequest(res, RELATION_ERROR_MESSAGES[result] ?? 'Invalid partner details.');
    }

    res.json({ partner: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id/status', async (req, res: express.Response<PartnerDetailsResponse>) => {
  const parsed = parseUpdatePartnerStatusInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updatePartnerStatus(req.params.id, parsed.data.status);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Partner not found.');
    }

    if (result === 'NO_MEDIA') {
      return badRequest(res, 'At least one partner image is required before activation.');
    }

    res.json({ partner: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.put('/:id/categories', async (req, res: express.Response<PartnerDetailsResponse>) => {
  const parsed = parseUpdatePartnerCategoriesInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updatePartnerCategories(req.params.id, parsed.data.categoryIds);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Partner not found.');
    }

    if (result === 'CATEGORY_NOT_FOUND') {
      return badRequest(res, 'One or more selected categories do not exist.');
    }

    res.json({ partner: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

// --- Media ---

router.get('/:id/media', async (req, res) => {
  try {
    const partner = await getPartnerById(req.params.id);

    if (!partner) {
      return notFound(res, 'Partner not found.');
    }

    res.json({ media: partner.media });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post(
  '/:id/media',
  upload.array('images', PARTNER_MEDIA_MAX_IMAGES),
  async (req: express.Request<{ id: string }>, res: express.Response<PartnerDetailsResponse>) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    if (files.length === 0) {
      return badRequest(res, 'At least one image file is required.');
    }

    try {
      const result = await uploadPartnerMedia(
        req.params.id,
        files.map((file) => ({ buffer: file.buffer, mimetype: file.mimetype, size: file.size }))
      );

      if (typeof result === 'string') {
        return sendMediaError(res, result);
      }

      res.status(201).json({ partner: result });
    } catch (error) {
      handleAdminError(res, error);
    }
  }
);

router.post(
  '/:id/media/:mediaId/replace',
  upload.single('image'),
  async (
    req: express.Request<{ id: string; mediaId: string }>,
    res: express.Response<PartnerDetailsResponse>
  ) => {
    if (!req.file) {
      return badRequest(res, 'An image file is required.');
    }

    try {
      const result = await replacePartnerMedia(req.params.id, req.params.mediaId, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      if (typeof result === 'string') {
        return sendMediaError(res, result);
      }

      res.json({ partner: result });
    } catch (error) {
      handleAdminError(res, error);
    }
  }
);

router.patch(
  '/:id/media/:mediaId/cover',
  async (req, res: express.Response<PartnerDetailsResponse>) => {
    try {
      const result = await setPartnerMediaCover(req.params.id, req.params.mediaId);

      if (typeof result === 'string') {
        return sendMediaError(res, result);
      }

      res.json({ partner: result });
    } catch (error) {
      handleAdminError(res, error);
    }
  }
);

router.delete('/:id/media/:mediaId', async (req, res: express.Response<PartnerDetailsResponse>) => {
  try {
    const result = await deletePartnerMedia(req.params.id, req.params.mediaId);

    if (typeof result === 'string') {
      return sendMediaError(res, result);
    }

    res.json({ partner: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

export default router;
