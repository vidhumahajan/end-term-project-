import mongoose from 'mongoose';
const activitySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, maxlength: 160 },
  details: { type: String, default: '', maxlength: 300 }
}, { timestamps: true });
export default mongoose.model('Activity', activitySchema);
