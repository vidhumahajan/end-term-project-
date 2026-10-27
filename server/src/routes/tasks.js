import { Router } from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Comment from '../models/Comment.js';
import Activity from '../models/Activity.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
const router = Router();
router.use(protect);
const validId = id => mongoose.isValidObjectId(id);
const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ message: e.array()[0].msg });
  next();
};
async function memberProject(projectId, userId) {
  return Project.findOne({ _id: projectId, members: userId });
}
async function taskAccess(taskId, userId) {
  if (!validId(taskId)) return null;
  const task = await Task.findById(taskId);
  if (!task) return null;
  const project = await memberProject(task.project, userId);
  return project ? { task, project } : null;
}
async function logActivity(task, user, action, details='') {
  await Activity.create({ task: task._id, project: task.project, actor: user._id, action, details });
}
router.get('/projects/:projectId/tasks', asyncHandler(async (req, res) => {
  if (!validId(req.params.projectId)) return res.status(400).json({ message: 'Invalid project ID.' });
  const project = await memberProject(req.params.projectId, req.user._id);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const filter = { project: project._id };
  if (req.query.status && ['Backlog','In Progress','Review','Done'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.priority && ['Low','Medium','High'].includes(req.query.priority)) filter.priority = req.query.priority;
  const tasks = await Task.find(filter).populate('assignee', 'name email').populate('createdBy', 'name email').sort({ updatedAt: -1 });
  res.json({ tasks });
}));
router.post('/projects/:projectId/tasks',
  body('title').trim().isLength({ min: 2, max: 140 }).withMessage('Task title must be 2–140 characters.'),
  body('description').optional().isLength({ max: 3000 }).withMessage('Description is too long.'),
  body('priority').optional().isIn(['Low','Medium','High']).withMessage('Invalid priority.'),
  validate, asyncHandler(async (req, res) => {
    if (!validId(req.params.projectId)) return res.status(400).json({ message: 'Invalid project ID.' });
    const project = await memberProject(req.params.projectId, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    let assignee = null;
    if (req.body.assignee) {
      if (!validId(req.body.assignee) || !project.members.some(m => String(m) === String(req.body.assignee)))
        return res.status(400).json({ message: 'Assignee must be a member of this project.' });
      assignee = req.body.assignee;
    }
    const task = await Task.create({
      project: project._id, title: req.body.title.trim(), description: req.body.description || '',
      priority: req.body.priority || 'Medium', status: 'Backlog', assignee,
      dueDate: req.body.dueDate || null, createdBy: req.user._id
    });
    await logActivity(task, req.user, 'created this task');
    await task.populate('assignee createdBy', 'name email');
    res.status(201).json({ task });
  })
);
router.patch('/tasks/:id',
  body('title').optional().trim().isLength({ min: 2, max: 140 }).withMessage('Task title must be 2–140 characters.'),
  body('status').optional().isIn(['Backlog','In Progress','Review','Done']).withMessage('Invalid status.'),
  body('priority').optional().isIn(['Low','Medium','High']).withMessage('Invalid priority.'),
  body('description').optional().isLength({ max: 3000 }).withMessage('Description is too long.'),
  validate, asyncHandler(async (req, res) => {
    const access = await taskAccess(req.params.id, req.user._id);
    if (!access) return res.status(404).json({ message: 'Task not found.' });
    const { task, project } = access;
    const changes = [];
    for (const key of ['title','description','status','priority','dueDate']) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const next = req.body[key] === '' && key === 'dueDate' ? null : req.body[key];
        if (String(task[key] ?? '') !== String(next ?? '')) changes.push(`${key}: ${task[key] || 'none'} → ${next || 'none'}`);
        task[key] = next;
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'assignee')) {
      const id = req.body.assignee || null;
      if (id && (!validId(id) || !project.members.some(m => String(m) === String(id))))
        return res.status(400).json({ message: 'Assignee must be a member of this project.' });
      if (String(task.assignee || '') !== String(id || '')) changes.push('assignee updated');
      task.assignee = id;
    }
    await task.save();
    if (changes.length) await logActivity(task, req.user, 'updated this task', changes.join('; ').slice(0,300));
    await task.populate('assignee createdBy', 'name email');
    res.json({ task });
  })
);
router.post('/tasks/:id/comments',
  body('body').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1–1000 characters.'),
  validate, asyncHandler(async (req, res) => {
    const access = await taskAccess(req.params.id, req.user._id);
    if (!access) return res.status(404).json({ message: 'Task not found.' });
    const comment = await Comment.create({ task: access.task._id, author: req.user._id, body: req.body.body.trim() });
    await comment.populate('author', 'name email');
    await logActivity(access.task, req.user, 'commented on this task', req.body.body.trim().slice(0,300));
    res.status(201).json({ comment });
  })
);
router.get('/tasks/:id/comments', asyncHandler(async (req, res) => {
  const access = await taskAccess(req.params.id, req.user._id);
  if (!access) return res.status(404).json({ message: 'Task not found.' });
  const comments = await Comment.find({ task: access.task._id }).populate('author', 'name email').sort({ createdAt: 1 });
  res.json({ comments });
}));
router.get('/tasks/:id/activity', asyncHandler(async (req, res) => {
  const access = await taskAccess(req.params.id, req.user._id);
  if (!access) return res.status(404).json({ message: 'Task not found.' });
  const activity = await Activity.find({ task: access.task._id }).populate('actor', 'name email').sort({ createdAt: -1 }).limit(50);
  res.json({ activity });
}));
export default router;
