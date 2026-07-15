import express from 'express';
import {
  parseGrantMembershipInput,
  parseMemberListQuery,
  parseUpdateMemberInput,
  parseUpdateMembershipInput,
  parseUpdateMemberStatusInput,
  type MemberDetailsResponse,
  type MemberListResponse,
} from '@apex-card/shared';

import { badRequest, handleAdminError, notFound } from '../lib/httpErrors';
import {
  getMemberById,
  grantMembership,
  listMembers,
  resetMembershipToFree,
  revokeMembership,
  updateMembership,
  updateMemberProfile,
  updateMemberStatus,
} from '../services/members';

const router: express.Router = express.Router();

router.get('/', async (req, res: express.Response<MemberListResponse>) => {
  const parsed = parseMemberListQuery(req.query);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await listMembers(parsed.data);
    res.json(result);
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.get('/:id', async (req, res: express.Response<MemberDetailsResponse>) => {
  try {
    const member = await getMemberById(req.params.id);

    if (!member) {
      return notFound(res, 'Member not found.');
    }

    res.json({ member });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id', async (req, res: express.Response<MemberDetailsResponse>) => {
  const parsed = parseUpdateMemberInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const member = await updateMemberProfile(req.params.id, parsed.data);

    if (!member) {
      return notFound(res, 'Member not found.');
    }

    res.json({ member });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id/status', async (req, res: express.Response<MemberDetailsResponse>) => {
  const parsed = parseUpdateMemberStatusInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const member = await updateMemberStatus(req.params.id, parsed.data.status);

    if (!member) {
      return notFound(res, 'Member not found.');
    }

    res.json({ member });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.patch('/:id/membership', async (req, res: express.Response<MemberDetailsResponse>) => {
  const parsed = parseUpdateMembershipInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await updateMembership(req.params.id, parsed.data);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Member not found.');
    }

    if (result === 'NO_MEMBERSHIP') {
      return badRequest(res, 'This member is on the Free plan — grant a membership first.');
    }

    res.json({ member: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/:id/membership/grant', async (req, res: express.Response<MemberDetailsResponse>) => {
  const parsed = parseGrantMembershipInput(req.body);

  if (!parsed.success) {
    return badRequest(res, parsed.message);
  }

  try {
    const result = await grantMembership(req.params.id, parsed.data);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Member not found.');
    }

    res.json({ member: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/:id/membership/revoke', async (req, res: express.Response<MemberDetailsResponse>) => {
  try {
    const result = await revokeMembership(req.params.id);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Member not found.');
    }

    if (result === 'NO_MEMBERSHIP') {
      return badRequest(res, 'This member does not have an active membership to revoke.');
    }

    res.json({ member: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

router.post('/:id/membership/reset', async (req, res: express.Response<MemberDetailsResponse>) => {
  try {
    const result = await resetMembershipToFree(req.params.id);

    if (result === 'NOT_FOUND') {
      return notFound(res, 'Member not found.');
    }

    res.json({ member: result });
  } catch (error) {
    handleAdminError(res, error);
  }
});

export default router;
