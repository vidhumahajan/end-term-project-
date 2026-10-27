import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};
const issueToken = user => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safeUser = user => ({ id: user._id, name: user.name, email: user.email });

router.post('/register',
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters.'),
  body('email').trim().isEmail().withMessage('Enter a valid email.'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters.'),
  validate, asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase().trim();
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ name: req.body.name.trim(), email, passwordHash });
    res.status(201).json({ token: issueToken(user), user: safeUser(user) });
  })
);
router.post('/login',
  body('email').isEmail().withMessage('Enter a valid email.'),
  body('password').notEmpty().withMessage('Password is required.'),
  validate, asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    res.json({ token: issueToken(user), user: safeUser(user) });
  })
);
router.get('/me', protect, (req, res) => res.json({ user: safeUser(req.user) }));
export default router;
