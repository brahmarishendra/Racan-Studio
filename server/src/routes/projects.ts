import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { Project } from '../models/Project.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const name = (req.query.name as string) || '';
  if (!name) return res.status(400).json({ error: 'name is required' });
  const project = await Project.findOne({ userId: req.user!.id, name });
  res.json({ project });
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { name, data } = req.body || {};
  if (!name || !data) return res.status(400).json({ error: 'Missing fields' });
  const project = await Project.findOneAndUpdate(
    { userId: req.user!.id, name },
    { $set: { data } },
    { new: true, upsert: true }
  );
  res.json(project);
});

export default router;
