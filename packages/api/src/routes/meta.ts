import express from 'express';
import { prisma } from '@apex/database';

const router: express.Router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [countries, cities, categories, partners, users] = await Promise.all([
      prisma.country.count(),
      prisma.city.count(),
      prisma.category.count(),
      prisma.partner.count(),
      prisma.user.count(),
    ]);

    res.json({
      countries,
      cities,
      categories,
      partners,
      users,
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

export default router;
