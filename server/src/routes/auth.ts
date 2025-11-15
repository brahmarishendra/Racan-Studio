import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';

const router = Router();
const JWT_SECRET = (process.env.JWT_SECRET as string) || 'dev-secret';

const dataUrlPattern = /^data:[a-zA-Z]+\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  avatarUrl: z.union([z.string().url(), z.string().regex(dataUrlPattern), z.literal('')]).optional(),
});

router.post('/register', async (req: Request, res: Response) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password, name, avatarUrl } = parse.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, name, avatarUrl, passwordHash });
  const token = jwt.sign({ id: user._id.toString(), email }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7*24*3600*1000 });
  res.json({ user: { id: user._id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password } = parse.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id.toString(), email }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7*24*3600*1000 });
  res.json({ user: { id: user._id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', async (req: Request, res: Response) => {
  const token = (req as any).cookies?.token as string | undefined;
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(payload.id);
    if (!user) return res.json({ user: null });
    res.json({ user: { id: user._id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
  } catch {
    res.json({ user: null });
  }
});

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.union([z.string().url(), z.string().regex(dataUrlPattern), z.literal('')]).optional(),
});

router.put('/profile', async (req: Request, res: Response) => {
  const token = (req as any).cookies?.token as string | undefined;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const parse = profileSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const updates: any = {};
    if (parse.data.name !== undefined) updates.name = parse.data.name;
    if (parse.data.avatarUrl !== undefined) updates.avatarUrl = parse.data.avatarUrl || undefined;
    const user = await User.findByIdAndUpdate(payload.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

export default router;
