import { Router, Response, Request } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { Template } from '../models/Template.js';
import { User } from '../models/User.js';

const router = Router();

// Public gallery: list public templates (no auth required)
router.get('/public', async (req: Request, res: Response) => {
  const page = parseInt(((req.query as any).page as string) || '1');
  const limit = Math.min(parseInt(((req.query as any).limit as string) || '50'), 100);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Template.find({ isPublic: true }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Template.countDocuments({ isPublic: true })
  ]);
  res.json({ items, total, page, limit });
});

router.get('/', requireAuth, async (req: AuthRequest & Request, res: Response) => {
  const page = parseInt(((req.query as any).page as string) || '1');
  const limit = Math.min(parseInt(((req.query as any).limit as string) || '50'), 100);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Template.find({ userId: req.user!.id }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Template.countDocuments({ userId: req.user!.id })
  ]);
  res.json({ items, total, page, limit });
});

router.post('/', requireAuth, async (req: AuthRequest & Request, res: Response) => {
  try {
    const { name, elements, canvasSize, canvasBg, thumbnail, isPublic } = (req as any).body || {};
    if (!name || !elements || !canvasSize || !thumbnail || !canvasBg) {
      return res.status(400).json({ error: 'Missing fields', required: ['name','elements','canvasSize','canvasBg','thumbnail'] });
    }
    const owner = await User.findById(req.user!.id);
    const item = await Template.create({
      userId: req.user!.id,
      name,
      elements,
      canvasSize,
      canvasBg,
      thumbnail,
      isPublic: !!isPublic,
      ownerName: owner?.name,
      ownerAvatar: owner?.avatarUrl,
    });
    res.status(201).json(item);
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest & Request, res: Response) => {
  const { id } = (req as any).params;
  const updated = await Template.findOneAndUpdate({ _id: id, userId: req.user!.id }, { $set: (req as any).body }, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req: AuthRequest & Request, res: Response) => {
  const { id } = (req as any).params;
  const deleted = await Template.findOneAndDelete({ _id: id, userId: req.user!.id });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
