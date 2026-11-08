import * as projects from "../services/projectService.js";

export async function list(req, res) {
  res.json({ projects: projects.list(req.session.userId) });
}
export async function create(req, res) {
  res
    .status(201)
    .json({ project: projects.create(req.session.userId, req.body) });
}
export async function update(req, res) {
  res.json({
    project: projects.update(req.session.userId, req.params.id, req.body),
  });
}
export async function remove(req, res) {
  projects.remove(req.session.userId, req.params.id);
  res.status(204).end();
}
