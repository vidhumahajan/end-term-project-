import Project from '../models/Project.js';
export async function requireProjectMember(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, members: userId })
    .populate('owner', 'name email').populate('members', 'name email');
  return project;
}
