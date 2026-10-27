import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import { requireProjectMember } from '../utils/access.js';
const router = Router();
router.use(protect);
const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ message: e.array()[0].msg });
  next();
};
const validId = id => mongoose.isValidObjectId(id);

router.get('/', asyncHandler(async (req, res) => {
  const projects = await Project.find({ members: req.user._id })
    .populate('owner', 'name email').populate('members', 'name email').sort({ updatedAt: -1 });
  const counts = await Task.aggregate([
    { $match: { project: { $in: projects.map(p => p._id) } } },
    { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } }
  ]);
  const byId = new Map(counts.map(c => [String(c._id), c]));
  res.json({ projects: projects.map(p => ({ ...p.toObject(), progress: byId.get(String(p._id)) || { total: 0, done: 0 } })) });
}));
router.post('/',
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2–100 characters.'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description is too long.'),
  validate, asyncHandler(async (req, res) => {
    const project = await Project.create({
      name: req.body.name.trim(), description: req.body.description || '',
      owner: req.user._id, members: [req.user._id]
    });
    await project.populate('owner members', 'name email');
    res.status(201).json({ project });
  })
);
router.get('/:id', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid project ID.' });
  const project = await requireProjectMember(req.params.id, req.user._id);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const tasks = await Task.find({ project: project._id }).populate('assignee', 'name email').populate('createdBy', 'name email').sort({ updatedAt: -1 });
  res.json({ project, tasks });
}));
router.post('/:id/members',
  body('email').trim().isEmail().withMessage('Enter a valid member email.'),
  validate, asyncHandler(async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid project ID.' });
    const project = await Project.findOne({ _id: req.params.id, members: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (String(project.owner) !== String(req.user._id)) return res.status(403).json({ message: 'Only the project owner can add members.' });
    const member = await User.findOne({ email: req.body.email.toLowerCase().trim() }).select('name email');
    if (!member) return res.status(404).json({ message: 'No registered account uses that email yet.' });
    if (project.members.some(id => String(id) === String(member._id))) return res.status(409).json({ message: 'That person is already a member.' });
    project.members.push(member._id);
    await project.save();
    await project.populate('owner members', 'name email');
    res.json({ project, message: `${member.name} added to the project.` });
  })
);
export default router;
