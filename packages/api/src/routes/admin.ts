import express from 'express';

import categoriesRouter from './categories';
import citiesRouter from './cities';
import countriesRouter from './countries';
import membersRouter from './members';
import partnersRouter from './partners';

const router: express.Router = express.Router();

router.use('/members', membersRouter);
router.use('/categories', categoriesRouter);
router.use('/countries', countriesRouter);
router.use('/cities', citiesRouter);
router.use('/partners', partnersRouter);

export default router;
