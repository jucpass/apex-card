import express from 'express';
import {
  parseCategoryInput,
  parseCityInput,
  parseCountryInput,
  slugify,
  type CategoriesResponse,
  type CategoryResponse,
  type CitiesResponse,
  type CityResponse,
  type CountriesResponse,
  type CountryResponse,
} from '@apex-card/shared';
import { Prisma, prisma } from '@apex/database';

const router: express.Router = express.Router();

const badRequest = (res: express.Response, message: string) =>
  res.status(400).json({ status: 'error', message });

const safeError = (res: express.Response) =>
  res.status(500).json({ status: 'error', message: 'Request failed' });

const handleAdminError = (res: express.Response, error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ status: 'error', message: 'A record with this value already exists.' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ status: 'error', message: 'This record is linked to another record.' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ status: 'error', message: 'Record not found.' });
    }
  }

  return safeError(res);
};

router.get('/countries', async (_req, res: express.Response<CountriesResponse>) => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });

    res.json({ countries });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/countries', async (req, res: express.Response<CountryResponse>) => {
  const parsed = parseCountryInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const country = await prisma.country.create({
      data: parsed.data,
      select: { id: true, name: true, code: true },
    });

    res.status(201).json({ country });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.put('/countries/:id', async (req, res: express.Response<CountryResponse>) => {
  const parsed = parseCountryInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const country = await prisma.country.update({
      where: { id: req.params.id },
      data: parsed.data,
      select: { id: true, name: true, code: true },
    });

    res.json({ country });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.delete('/countries/:id', async (req, res) => {
  try {
    await prisma.country.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/cities', async (_req, res: express.Response<CitiesResponse>) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: [{ country: { name: 'asc' } }, { name: 'asc' }],
      select: { id: true, name: true, countryId: true },
    });

    res.json({ cities });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/cities', async (req, res: express.Response<CityResponse>) => {
  const parsed = parseCityInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const city = await prisma.city.create({
      data: { ...parsed.data, slug: slugify(parsed.data.name) },
      select: { id: true, name: true, countryId: true },
    });

    res.status(201).json({ city });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.put('/cities/:id', async (req, res: express.Response<CityResponse>) => {
  const parsed = parseCityInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const city = await prisma.city.update({
      where: { id: req.params.id },
      data: { ...parsed.data, slug: slugify(parsed.data.name) },
      select: { id: true, name: true, countryId: true },
    });

    res.json({ city });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.delete('/cities/:id', async (req, res) => {
  try {
    await prisma.city.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/categories', async (_req, res: express.Response<CategoriesResponse>) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, icon: true },
    });

    res.json({ categories });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/categories', async (req, res: express.Response<CategoryResponse>) => {
  const parsed = parseCategoryInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const category = await prisma.category.create({
      data: { ...parsed.data, icon: parsed.data.icon || null },
      select: { id: true, name: true, slug: true, icon: true },
    });

    res.status(201).json({ category });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.put('/categories/:id', async (req, res: express.Response<CategoryResponse>) => {
  const parsed = parseCategoryInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { ...parsed.data, icon: parsed.data.icon || null },
      select: { id: true, name: true, slug: true, icon: true },
    });

    res.json({ category });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handleAdminError(res, error);
  }
});

export default router;
