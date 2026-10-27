import mongoose from 'mongoose';
const taskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  status: { type: String, enum: ['Backlog', 'In Progress', 'Review', 'Done'], default: 'Backlog' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
taskSchema.index({ project: 1, status: 1, updatedAt: -1 });
export default mongoose.model('Task', taskSchema);
