import express from 'express';
import {
  parseCategoryListQuery,
  parseCreateCategoryInput,
  parseUpdateCategoryInput,
  parseUpdateCategoryStatusInput,
  type CategoryDetailsResponse,
  type CategoryListResponse,
} from '@apex-card/shared';

import { badRequest, conflict, handleAdminError, notFound } from '../lib/httpErrors';
import {
  createCategory,
  getCategoryById,
  listCategories,
  updateCategory,
  updateCategoryStatus,
} from '../services/categories';

const router: express.Router = express.Router();

router.get('/', async (req, res: express.Response<CategoryListResponse>) => {
  const parsed = parseCategoryListQuery(req.query);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await listCategories(parsed.data);
    res.json(result);
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/:id', async (req, res: express.Response<CategoryDetailsResponse>) => {
  try {
    const category = await getCategoryById(req.params.id);

    if (!category) {
      return notFound(res, 'Category not found.');
    }

    res.json({ category });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/', async (req, res: express.Response<CategoryDetailsResponse>) => {
  const parsed = parseCreateCategoryInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await createCategory(parsed.data);

    if (result === 'DUPLICATE_NAME') {
      return conflict(res, 'A category with this name already exists.');
    }

    res.status(201).json({ category: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id', async (req, res: express.Response<CategoryDetailsResponse>) => {
  const parsed = parseUpdateCategoryInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updateCategory(req.params.id, parsed.data);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Category not found.');
    }

    if (result === 'DUPLICATE_NAME') {
      return conflict(res, 'A category with this name already exists.');
    }

    res.json({ category: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id/status', async (req, res: express.Response<CategoryDetailsResponse>) => {
  const parsed = parseUpdateCategoryStatusInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updateCategoryStatus(req.params.id, parsed.data.active);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Category not found.');
    }

    res.json({ category: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

export default router;
