import express from 'express';
import { Prisma } from '@apex/database';

export const badRequest = (res: express.Response, message: string) =>
  res.status(400).json({ status: 'error', message });

export const notFound = (res: express.Response, message = 'Record not found.') =>
  res.status(404).json({ status: 'error', message });

export const conflict = (res: express.Response, message: string) =>
  res.status(409).json({ status: 'error', message });

export const safeError = (res: express.Response) =>
  res.status(500).json({ status: 'error', message: 'Request failed' });

export const handleAdminError = (res: express.Response, error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ status: 'error', message: 'A record with this value already exists.' });
    }

    if (error.code === 'P2003') {
      return res
        .status(400)
        .json({ status: 'error', message: 'This record is linked to another record.' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ status: 'error', message: 'Record not found.' });
    }
  }

  return safeError(res);
};
